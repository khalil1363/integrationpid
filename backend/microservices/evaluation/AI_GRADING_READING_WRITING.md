# Automatic grading for Reading and Writing (Ollama / AI)

Reading and Writing questions are now **automatically graded** using **Ollama** (local AI). You need to have Ollama installed and running with a model (e.g. `llama3.2`).

---

## 1. Code reference (files involved)

| File | Role |
|------|------|
| `evaluation/src/main/java/.../service/AiGradingService.java` | Interface: `gradeTextAnswer(questionText, studentAnswer, maxPoints, context)` returns score 0 to maxPoints. |
| `evaluation/src/main/java/.../service/impl/AiGradingServiceImpl.java` | Builds fair-grading prompt, calls Ollama chat API, parses score from response (supports "Score: 8", "10/10", plain number). On failure returns 0 and logs warning. |
| `evaluation/src/main/java/.../service/impl/EvaluationAttemptServiceImpl.java` | In `calculateScore(attempt)`, for each READING/WRITING answer with non-empty text: loads context (Reading instructions if READING), calls `aiGradingService.gradeTextAnswer(...)`, sets `answer.setScoreAwarded(aiScore)` and adds to total. |

---

## 2. Prerequisites

- **Ollama** installed from [ollama.com](https://ollama.com)
- A model pulled, e.g.:
  ```bash
  ollama pull llama3.2
  ```
- Ollama service running (default: `http://localhost:11434`)

The evaluation microservice uses the same Ollama URL and model as for generating Reading questions from PDF (see `application.properties`: `ai.ollama.url`, `ai.ollama.model`).

---

## 3. When does automatic grading run?

When a student **finishes an attempt** (clicks "Finish & Submit"):

1. The backend loads all submitted answers for that attempt.
2. For each **Reading** and **Writing** question:
   - If the student wrote a non-empty text answer, the backend calls **Ollama** to grade it.
   - The AI is given: the question text, the student's answer, the maximum points for the question, and (for Reading) the question's instructions as context.
   - Ollama returns a **score from 0 to max points** (decimals allowed, e.g. 1.5).
3. That score is stored in `scoreAwarded` for the answer and included in the attempt's total score.
4. MCQ, MSQ, and Fill-in-the-blanks are still graded as before (no AI).

If Ollama is **not available** or the AI response cannot be parsed, the Reading/Writing answer is given a score of **0** and a warning is logged. The rest of the attempt is still saved.

---

## 4. Backend code

### 4.1 Service interface

**File:** `service/AiGradingService.java`

```java
/**
 * Grade a student's text answer using AI.
 * @param questionText  The question or prompt the student answered.
 * @param studentAnswer The student's text answer to grade.
 * @param maxPoints     Maximum points for this question (e.g. 2.0, 10.0).
 * @param context       Optional context (e.g. Reading instructions). Can be null or empty.
 * @return Score from 0 to maxPoints. Returns 0 if grading fails or Ollama is unavailable.
 */
double gradeTextAnswer(String questionText, String studentAnswer, double maxPoints, String context);
```

### 4.2 Service implementation – main flow and prompt

**File:** `service/impl/AiGradingServiceImpl.java`

- Calls Ollama's chat API with a **fair-grading prompt** that instructs the model to:
  - Award **full points** when the student's answer is correct or substantially correct (even if wording differs).
  - Give **high partial credit** for mostly correct answers or good understanding with minor gaps.
  - Give **some credit** for partially correct or incomplete but relevant answers.
  - Give **0 only** when the answer is wrong, irrelevant, or off-topic.
  - Prefer the higher score when in doubt.
- Truncates long question/answer text. Parses the score from the reply (supports formats like a plain number, "Score: 8", "10/10", etc.) and clamps it to [0, maxPoints].
- On any exception (e.g. Ollama not running), returns 0.0 and logs a warning.
- **Debug logging:** at DEBUG level, the raw AI response and parsed score are logged (enable `logging.level.com.evaluation.evaluation.service.impl.AiGradingServiceImpl=DEBUG` to troubleshoot grading).

**Main method – call Ollama and parse score:**

```java
@Override
public double gradeTextAnswer(String questionText, String studentAnswer, double maxPoints, String context) {
    if (studentAnswer == null || studentAnswer.isBlank()) {
        return 0.0;
    }
    String q = truncate(questionText, MAX_QUESTION_LENGTH);
    String a = truncate(studentAnswer, MAX_ANSWER_LENGTH);
    String ctx = context != null && !context.isBlank() ? truncate(context, 500) : "";

    String prompt = buildPrompt(q, a, maxPoints, ctx);

    String body = """
        {"model":"%s","messages":[{"role":"user","content":"%s"}],"stream":false}
        """
        .formatted(escapeJson(model), escapeJson(prompt));

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    HttpEntity<String> request = new HttpEntity<>(body, headers);

    try {
        ResponseEntity<Map> response = restTemplate.exchange(ollamaUrl, HttpMethod.POST, request, Map.class);
        // ... get content from response.getBody().choices[0].message.content
        double score = parseScore(content, maxPoints);
        if (log.isDebugEnabled()) {
            log.debug("AI grading raw response: [{}] -> parsed score: {}", content.trim(), score);
        }
        return score;
    } catch (Exception e) {
        log.warn("AI grading failed (Ollama may be unavailable): {}", e.getMessage());
        return 0.0;
    }
}
```

**Fair-grading prompt (buildPrompt):**

```java
private static String buildPrompt(String questionText, String studentAnswer, double maxPoints, String context) {
    StringBuilder sb = new StringBuilder();
    sb.append("You are a fair teacher grading a student's written answer (e.g. reading comprehension or short answer).\n\n");
    sb.append("RULES:\n");
    sb.append("- Award FULL points (").append(formatPoints(maxPoints)).append(") if the student's answer is CORRECT or SUBSTANTIALLY CORRECT, even if wording is different or not perfect.\n");
    sb.append("- Give HIGH partial credit (e.g. 70-90% of ").append(formatPoints(maxPoints)).append(") if the answer is mostly correct or shows good understanding with minor gaps.\n");
    sb.append("- Give SOME credit (e.g. 40-70%) for partially correct or incomplete but relevant answers.\n");
    sb.append("- Give 0 ONLY if the answer is wrong, irrelevant, off-topic, or does not address the question at all.\n");
    sb.append("- Do NOT be overly strict. If in doubt between two scores, choose the higher one.\n\n");
    sb.append("Question: ").append(questionText).append("\n\n");
    if (!context.isEmpty()) {
        sb.append("Context/Instructions: ").append(context).append("\n\n");
    }
    sb.append("Student's answer: ").append(studentAnswer).append("\n\n");
    sb.append("Return ONLY a single number from 0 to ").append(formatPoints(maxPoints)).append(" (decimals allowed, e.g. 8.5). No explanation, no other text:");
    return sb.toString();
}
```

**Score parsing – supports "Score: 8", "10/10", or plain number:**

```java
private static double parseScore(String content, double maxPoints) {
    String trimmed = content.trim();
    // Try "Score: 8" or "points: 10" first
    Matcher prefix = SCORE_PREFIX_PATTERN.matcher(trimmed);
    if (prefix.find()) {
        double score = Double.parseDouble(prefix.group(1));
        if (score >= 0 && score <= maxPoints) return score;
        if (score > maxPoints) return maxPoints;
        return Math.max(0, score);
    }
    // Try "8/10" or "10/10" format -> (num/den)*maxPoints
    Matcher frac = FRACTION_PATTERN.matcher(trimmed);
    if (frac.find()) {
        double num = Double.parseDouble(frac.group(1));
        double den = Double.parseDouble(frac.group(2));
        if (den > 0) {
            double score = (num / den) * maxPoints;
            return Math.min(maxPoints, Math.max(0, score));
        }
    }
    // Generic number in text
    Matcher m = NUMBER_PATTERN.matcher(trimmed);
    if (m.find()) {
        double score = Double.parseDouble(m.group(1));
        if (score >= 0 && score <= maxPoints) return score;
        if (score > maxPoints) return maxPoints;
        return Math.max(0, score);
    }
    return 0.0;
}
```

### 4.3 Where it is used

**File:** `service/impl/EvaluationAttemptServiceImpl.java`

In `calculateScore(attempt)`, for each answer the switch on question type handles **READING** and **WRITING** by calling the AI grading service. For Reading, context is loaded from the question's instructions.

```java
case READING:
case WRITING:
    // Automatic grading with Ollama (AI)
    String textAnswer = answer.getTextAnswer();
    double pointsForQuestion = question.getPoints() != null ? question.getPoints() : 0.0;
    if (textAnswer != null && !textAnswer.isBlank() && pointsForQuestion > 0) {
        String context = "";
        if (question.getQuestionType() == QuestionType.READING) {
            context = readingQuestionRepository.findById(question.getId())
                    .map(rq -> rq.getInstructions() != null ? rq.getInstructions() : "")
                    .orElse("");
        }
        double aiScore = aiGradingService.gradeTextAnswer(
                question.getQuestionText() != null ? question.getQuestionText() : "",
                textAnswer,
                pointsForQuestion,
                context);
        answer.setScoreAwarded(aiScore);
        totalScore += aiScore;
    } else {
        answer.setScoreAwarded(0.0);
    }
    break;
```

After the loop, each answer (including score) is saved with `studentAnswerRepository.save(a)`.

---

## 5. Configuration

Same as for PDF question generation in `application.properties`:

- `ai.ollama.url=http://localhost:11434/v1/chat/completions`
- `ai.ollama.model=llama3.2`

---

## 6. Summary

| Question type | Grading method |
|---------------|----------------|
| MCQ, MSQ, FILL_BLANK | Existing automatic logic |
| **READING** | **Automatic via Ollama (AI)** |
| **WRITING** | **Automatic via Ollama (AI)** |

If Ollama is not running or the AI call fails, Reading/Writing answers get 0 and the attempt is still submitted.
