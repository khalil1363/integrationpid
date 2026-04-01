# Postman Test Collection for Evaluation Microservice

Base URL: `http://localhost:8020`

## 1. User Management (single table with role: STUDENT or TEACHER)

### Create User (Teacher)
- **Method**: POST
- **URL**: `http://localhost:8020/api/users`
- **Body** (JSON):
```json
{
  "name": "John",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "tel": "1234567890",
  "role": "TEACHER"
}
```

### Create User (Student)
- **Method**: POST
- **URL**: `http://localhost:8020/api/users`
- **Body** (JSON):
```json
{
  "name": "Alice",
  "surname": "Johnson",
  "email": "alice.johnson@example.com",
  "tel": "9876543210",
  "role": "STUDENT"
}
```

### Get All Users
- **Method**: GET
- **URL**: `http://localhost:8020/api/users`

### Get Users by Role (students only)
- **Method**: GET
- **URL**: `http://localhost:8020/api/users?role=STUDENT`

### Get Users by Role (teachers only)
- **Method**: GET
- **URL**: `http://localhost:8020/api/users?role=TEACHER`

### Get User by ID
- **Method**: GET
- **URL**: `http://localhost:8020/api/users/{id}`

### Update User
- **Method**: PUT
- **URL**: `http://localhost:8020/api/users/{id}`
- **Body** (JSON):
```json
{
  "name": "John",
  "surname": "Smith",
  "email": "john.smith@example.com",
  "tel": "1234567890",
  "role": "TEACHER"
}
```

### Delete User
- **Method**: DELETE
- **URL**: `http://localhost:8020/api/users/{id}`

---

## 2. Evaluation Management

### Create Evaluation
- **Method**: POST
- **URL**: `http://localhost:8020/api/evaluations`
- **Body** (JSON):
```json
{
  "title": "Math Quiz 1",
  "imageUrl": "https://example.com/image.jpg",
  "dateStart": "2026-02-20T09:00:00",
  "dateEnd": "2026-02-25T23:59:59",
  "durationMinutes": 60,
  "numberOfAttempts": 2,
  "totalScore": 100.0
}
```

### Get All Evaluations
- **Method**: GET
- **URL**: `http://localhost:8020/api/evaluations`

### Get Evaluation by ID
- **Method**: GET
- **URL**: `http://localhost:8020/api/evaluations/{id}`

### Update Evaluation
- **Method**: PUT
- **URL**: `http://localhost:8020/api/evaluations/{id}`
- **Body** (JSON):
```json
{
  "title": "Math Quiz 1 - Updated",
  "imageUrl": "https://example.com/image2.jpg",
  "dateStart": "2026-02-20T09:00:00",
  "dateEnd": "2026-02-26T23:59:59",
  "durationMinutes": 90,
  "numberOfAttempts": 3,
  "totalScore": 100.0
}
```

### Delete Evaluation
- **Method**: DELETE
- **URL**: `http://localhost:8020/api/evaluations/{id}`

### Get Available Evaluations for User (student)
- **Method**: GET
- **URL**: `http://localhost:8020/api/evaluations/available/user/{userId}`

---

## 3. Question Management

### Add MCQ Question to Evaluation
- **Method**: POST
- **URL**: `http://localhost:8020/api/mcq-questions`
- **Body** (JSON):
```json
{
  "questionText": "What is 2 + 2?",
  "points": 10.0,
  "questionType": "MCQ",
  "questionOrder": 1,
  "evaluationId": 1,
  "options": [
    {
      "optionText": "3",
      "isCorrect": false
    },
    {
      "optionText": "4",
      "isCorrect": true
    },
    {
      "optionText": "5",
      "isCorrect": false
    }
  ]
}
```

### Get MCQ Questions by Evaluation
- **Method**: GET
- **URL**: `http://localhost:8020/api/mcq-questions/evaluation/{evaluationId}`

### Delete MCQ Question
- **Method**: DELETE
- **URL**: `http://localhost:8020/api/mcq-questions/{id}`

### Add MSQ Question to Evaluation
- **Method**: POST
- **URL**: `http://localhost:8020/api/msq-questions`
- **Body** (JSON):
```json
{
  "questionText": "Which of the following are prime numbers?",
  "points": 15.0,
  "questionType": "MSQ",
  "questionOrder": 2,
  "evaluationId": 1,
  "options": [
    {
      "optionText": "2",
      "isCorrect": true
    },
    {
      "optionText": "4",
      "isCorrect": false
    },
    {
      "optionText": "7",
      "isCorrect": true
    },
    {
      "optionText": "9",
      "isCorrect": false
    }
  ]
}
```

### Get MSQ Questions by Evaluation
- **Method**: GET
- **URL**: `http://localhost:8020/api/msq-questions/evaluation/{evaluationId}`

### Delete MSQ Question
- **Method**: DELETE
- **URL**: `http://localhost:8020/api/msq-questions/{id}`

### Add Fill Blank Question to Evaluation
- **Method**: POST
- **URL**: `http://localhost:8020/api/fillblank-questions`
- **Body** (JSON):
```json
{
  "questionText": "Fill in the blanks: The capital of France is ____ and the capital of Italy is ____.",
  "points": 20.0,
  "questionType": "FILL_BLANK",
  "questionOrder": 3,
  "evaluationId": 1,
  "paragraphText": "The capital of France is ____ and the capital of Italy is ____.",
  "blanks": [
    {
      "correctWord": "Paris",
      "positionIndex": 0
    },
    {
      "correctWord": "Rome",
      "positionIndex": 1
    }
  ]
}
```

### Delete Fill Blank Question
- **Method**: DELETE
- **URL**: `http://localhost:8020/api/fillblank-questions/{id}`

### Add Reading Question to Evaluation
- **Method**: POST
- **URL**: `http://localhost:8020/api/reading-questions`
- **Body** (JSON):
```json
{
  "questionText": "Read the passage and answer the questions",
  "points": 25.0,
  "questionType": "READING",
  "questionOrder": 4,
  "evaluationId": 1,
  "pdfUrl": "https://example.com/reading-passage.pdf",
  "instructions": "Read the passage carefully and answer all questions"
}
```

### Get Reading Questions by Evaluation
- **Method**: GET
- **URL**: `http://localhost:8020/api/reading-questions/evaluation/{evaluationId}`

### Delete Reading Question
- **Method**: DELETE
- **URL**: `http://localhost:8020/api/reading-questions/{id}`

### Add Writing Question to Evaluation
- **Method**: POST
- **URL**: `http://localhost:8020/api/writing-questions`
- **Body** (JSON):
```json
{
  "questionText": "Write an essay about climate change",
  "points": 30.0,
  "questionType": "WRITING",
  "questionOrder": 5,
  "evaluationId": 1,
  "subject": "Climate Change",
  "maxWords": 500
}
```

### Get Writing Questions by Evaluation
- **Method**: GET
- **URL**: `http://localhost:8020/api/writing-questions/evaluation/{evaluationId}`

### Delete Writing Question
- **Method**: DELETE
- **URL**: `http://localhost:8020/api/writing-questions/{id}`

---

## 4. Student Evaluation Flow (user with role STUDENT)

### Start Evaluation Attempt
- **Method**: POST
- **URL**: `http://localhost:8020/api/attempts/start/{evaluationId}?userId={userId}`
- **Example**: `http://localhost:8020/api/attempts/start/1?userId=2`

### Submit Answer for Question
- **Method**: POST
- **URL**: `http://localhost:8020/api/attempts/{attemptId}/submit-answer/{questionId}`
- **Body for MCQ** (JSON):
```json
{
  "selectedOptions": [
    {
      "id": 2
    }
  ]
}
```

- **Body for MSQ** (JSON):
```json
{
  "selectedOptions": [
    {
      "id": 1
    },
    {
      "id": 3
    }
  ]
}
```

- **Body for Fill Blank** (JSON):
```json
{
  "textAnswer": "Paris,Rome"
}
```

- **Body for Reading/Writing** (JSON):
```json
{
  "textAnswer": "Student's answer text here"
}
```

### Finish Evaluation Attempt (Submit Final Response)
- **Method**: POST
- **URL**: `http://localhost:8020/api/attempts/{attemptId}/finish`

### Get Attempt by ID (View Results with Mistakes)
- **Method**: GET
- **URL**: `http://localhost:8020/api/attempts/{attemptId}`
- **Note**: This returns the attempt with all student answers, scores, and you can compare `scoreAwarded` with `question.points` to see mistakes

### Get User Attempts for Evaluation
- **Method**: GET
- **URL**: `http://localhost:8020/api/attempts/user/{userId}/evaluation/{evaluationId}`

---

## 5. Teacher View and Score Management (user with role TEACHER)

### Get All Attempts for Evaluation (Teacher View)
- **Method**: GET
- **URL**: `http://localhost:8020/api/attempts/evaluation/{evaluationId}`
- **Note**: Teacher can see all student attempts for their evaluation

### Update Student Answer Score (Teacher Manual Grading)
- **Method**: PUT
- **URL**: `http://localhost:8020/api/attempts/answer/{answerId}/score`
- **Body** (JSON):
```json
{
  "score": 8.5
}
```
- **Note**: This allows teacher to manually adjust scores for Reading/Writing questions or override auto-graded scores

---

## Testing Flow Example

### Complete Flow:

1. **Create Teacher (User with role TEACHER)**
   - POST `/api/users` with body including `"role": "TEACHER"`

2. **Create Student (User with role STUDENT)**
   - POST `/api/users` with body including `"role": "STUDENT"`

3. **Create Evaluation**
   - POST `/api/evaluations` with evaluation data

4. **Add Questions to Evaluation**
   - POST `/api/mcq-questions` with MCQ question
   - POST `/api/msq-questions` with MSQ question
   - POST `/api/fillblank-questions` with Fill Blank question
   - POST `/api/reading-questions` with Reading question
   - POST `/api/writing-questions` with Writing question

5. **Student (user) Views Available Evaluations**
   - GET `/api/evaluations/available/user/{userId}`

6. **Student (user) Starts Attempt**
   - POST `/api/attempts/start/{evaluationId}?userId={userId}`

7. **Student Submits Answers**
   - POST `/api/attempts/{attemptId}/submit-answer/{questionId}` for each question

8. **Student Finishes Attempt**
   - POST `/api/attempts/{attemptId}/finish`

9. **Student Views Results**
   - GET `/api/attempts/{attemptId}` - See score and mistakes

10. **Teacher Views All Attempts**
    - GET `/api/attempts/evaluation/{evaluationId}`

11. **Teacher Updates Score (if needed)**
    - PUT `/api/attempts/answer/{answerId}/score` with new score

---

## Notes:

- All dates should be in ISO format: `YYYY-MM-DDTHH:mm:ss` (e.g., `2026-02-20T09:00:00`)
- The `numberOfAttempts` field limits how many times a student can submit the evaluation
- When a student starts an attempt, the system checks:
  - If evaluation is within date range (dateStart to dateEnd)
  - If student hasn't exceeded max attempts
- Scoring is automatic for MCQ, MSQ, and Fill Blank questions
- Reading and Writing questions need manual grading by teacher
- The attempt status can be: `IN_PROGRESS`, `SUBMITTED`, or `EXPIRED`
