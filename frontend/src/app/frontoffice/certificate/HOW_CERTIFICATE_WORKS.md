# Certificate Feature – Full Explanation (Code + Logic)

This document explains **every part** of the SlangEnglish certificate: the rule, backend (DTO, repository, service, controller), and frontend (API, component, template, styles, routing, menu). Nothing is skipped.

---

## 1. The certificate rule (what we implement)

- A student **earns the certificate** when they have **passed at least 5 different evaluations** with **≥ 50%** in at least one **submitted** attempt per evaluation.
- **“Passed”** = for that evaluation, the student has at least one attempt with `status = SUBMITTED` and `score / maxScore >= 0.5` (maxScore = evaluation’s totalScore).
- **“5 different evaluations”** = we count **distinct evaluation IDs** that were passed, not total attempts. The certificate references **these same evaluations** (their titles are returned and shown on the certificate), not random ones.
- **Level (A1–C2):** When eligible, the certificate shows a **level** based on the **certificate score** (0–100). The certificate score is the **average of the best attempt percentage** (score/maxScore × 100) for each passed evaluation. The level is then:
  - **0–39** → A1  
  - **40–54** → A2  
  - **55–69** → B1  
  - **70–83** → B2  
  - **84–91** → C1  
  - **92–100** → C2  

---

## 2. Backend – Overview

The backend does the following:

1. **DTO**: Define the JSON we return: `eligible`, `passedCount`, `passedEvaluationTitles` (list of evaluation titles the user passed), `certificateScore` (0–100, average of best attempt % per passed evaluation), `level` (A1–C2).
2. **Repository**: Load all SUBMITTED attempts for a user **with** the evaluation entity (so we have `totalScore` and `title`).
3. **Service**: From those attempts, compute for each evaluation the **best** attempt percentage (score/totalScore); count as “passed” when ≥ 50%. Build the list of passed evaluation titles, set `eligible = (passedCount >= 5)`. When eligible, compute `certificateScore` = average of those best percentages × 100, and `level` from the score bands (0–39 A1, 40–54 A2, 55–69 B1, 70–83 B2, 84–91 C1, 92–100 C2).
4. **Controller**: Expose `GET /api/certificate/eligibility/{userId}` and return the DTO.

---

## 3. Backend – DTO (response shape)

**File:** `backend/microservices/evaluation/src/main/java/com/evaluation/evaluation/dto/CertificateEligibilityResponse.java`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateEligibilityResponse {
    private boolean eligible;
    private int passedCount;
    /** Titles of the evaluations the user passed (≥50%); used on the certificate. */
    private List<String> passedEvaluationTitles;
    /** Average score (0–100) across best attempt per passed evaluation; used for level. */
    private Double certificateScore;
    /** Level A1–C2 based on certificateScore: 0–39 A1, 40–54 A2, 55–69 B1, 70–83 B2, 84–91 C1, 92–100 C2. */
    private String level;
}
```

**Explanation:**

- `eligible`: `true` when the user has passed **at least 5** different evaluations with ≥ 50%.
- `passedCount`: number of **distinct** evaluations the user has passed.
- `passedEvaluationTitles`: list of **evaluation titles** for those passed evaluations (the same ones that count toward the 5); shown on the certificate so it’s clear which evaluations the certificate is for.
- `certificateScore`: when eligible, the **average** of (best attempt score / maxScore × 100) for each passed evaluation, so a number between 0 and 100.
- `level`: when eligible, one of **A1, A2, B1, B2, C1, C2** from the certificate score bands above.

---

## 4. Backend – Repository (load attempts with evaluation)

**File:** `backend/microservices/evaluation/src/main/java/com/evaluation/evaluation/repository/EvaluationAttemptRepository.java`

```java
@Query("SELECT a FROM EvaluationAttempt a JOIN FETCH a.evaluation WHERE a.userId = :userId AND a.status = :status")
List<EvaluationAttempt> findByUserIdAndStatusWithEvaluation(@Param("userId") Long userId, @Param("status") AttemptStatus status);
```

**Explanation:**

- We need **all SUBMITTED attempts** for a given user, and for each attempt we need the **evaluation** (to read `totalScore`).
- `EvaluationAttempt` has a `@ManyToOne` to `Evaluation`. Without `JOIN FETCH`, loading the evaluation would be lazy and could cause N+1 queries or a lazy load exception when we read `a.getEvaluation().getTotalScore()` in the service.
- `JOIN FETCH a.evaluation` loads the evaluation in the same query, so one DB round-trip gives us attempts + their evaluations.
- We filter by `userId` and `status = SUBMITTED` so we only consider finished attempts that were actually submitted (not IN_PROGRESS or EXPIRED).

---

## 5. Backend – Service interface (contract)

**File:** `backend/microservices/evaluation/src/main/java/com/evaluation/evaluation/service/EvaluationAttemptService.java`

Added method:

```java
com.evaluation.evaluation.dto.CertificateEligibilityResponse getCertificateEligibility(Long userId);
```

**Explanation:**

- The controller will call this method with the current user’s ID. The service is responsible for computing eligibility and passed count.

---

## 6. Backend – Service implementation (eligibility logic)

**File:** `backend/microservices/evaluation/src/main/java/com/evaluation/evaluation/service/impl/EvaluationAttemptServiceImpl.java`

**Import added:**

```java
import com.evaluation.evaluation.dto.CertificateEligibilityResponse;
```

**Method implementation:**

The service loads all SUBMITTED attempts with evaluation, then for each attempt with score ≥ 50% of that evaluation’s totalScore it tracks the **best** percentage per evaluation (using a map). It also keeps the evaluation title for each passed evaluation. Then:

- `passedCount` = size of that map.
- `eligible` = passedCount >= 5.
- `passedEvaluationTitles` = list of titles (in stable order).
- When eligible, `certificateScore` = average of the best percentages × 100.
- `level` = from `getLevelFromScore(certificateScore)` using the bands: 0–39 A1, 40–54 A2, 55–69 B1, 70–83 B2, 84–91 C1, 92–100 C2.

```java
@Override
public CertificateEligibilityResponse getCertificateEligibility(Long userId) {
    List<EvaluationAttempt> submitted = evaluationAttemptRepository.findByUserIdAndStatusWithEvaluation(userId, AttemptStatus.SUBMITTED);
    Map<Long, Double> bestPctPerEval = new LinkedHashMap<>();
    Map<Long, String> evalTitles = new LinkedHashMap<>();

    for (EvaluationAttempt a : submitted) {
        if (a.getScore() == null) continue;
        Evaluation ev = a.getEvaluation();
        if (ev == null || ev.getTotalScore() == null || ev.getTotalScore() <= 0) continue;
        double pct = a.getScore() / ev.getTotalScore();
        if (pct >= 0.5) {
            Long id = ev.getId();
            bestPctPerEval.merge(id, pct, Math::max);
            evalTitles.putIfAbsent(id, ev.getTitle() != null ? ev.getTitle() : "Evaluation");
        }
    }

    int passedCount = bestPctPerEval.size();
    boolean eligible = passedCount >= 5;
    List<String> passedEvaluationTitles = new ArrayList<>(evalTitles.values());
    double certificateScore = 0.0;
    String level = null;

    if (eligible && !bestPctPerEval.isEmpty()) {
        certificateScore = bestPctPerEval.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0) * 100.0;
        level = getLevelFromScore(certificateScore);
    }

    return new CertificateEligibilityResponse(eligible, passedCount, passedEvaluationTitles, certificateScore, level);
}

/** 0–39 A1, 40–54 A2, 55–69 B1, 70–83 B2, 84–91 C1, 92–100 C2. */
private static String getLevelFromScore(double score) {
    if (score >= 92) return "C2";
    if (score >= 84) return "C1";
    if (score >= 70) return "B2";
    if (score >= 55) return "B1";
    if (score >= 40) return "A2";
    return "A1";
}
```

**Explanation step by step:**

1. Load all SUBMITTED attempts with evaluation.
2. For each attempt with score ≥ 50% of evaluation totalScore: keep the **maximum** percentage per evaluation id (`bestPctPerEval`) and store the evaluation title (`evalTitles`).
3. `passedCount` = number of distinct passed evaluations; `eligible` = passedCount >= 5.
4. `passedEvaluationTitles` = list of titles (order from iteration).
5. When eligible: `certificateScore` = average of best percentages × 100; `level` = result of `getLevelFromScore(certificateScore)`.

---

## 7. Backend – Controller (REST endpoint)

**File:** `backend/microservices/evaluation/src/main/java/com/evaluation/evaluation/controller/CertificateController.java`

```java
package com.evaluation.evaluation.controller;

import com.evaluation.evaluation.dto.CertificateEligibilityResponse;
import com.evaluation.evaluation.service.EvaluationAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificate")
@RequiredArgsConstructor
public class CertificateController {

    private final EvaluationAttemptService evaluationAttemptService;

    @GetMapping("/eligibility/{userId}")
    public ResponseEntity<CertificateEligibilityResponse> getEligibility(@PathVariable Long userId) {
        return ResponseEntity.ok(evaluationAttemptService.getCertificateEligibility(userId));
    }
}
```

**Explanation:**

- **URL:** `GET /api/certificate/eligibility/{userId}`  
  Example: `GET /api/certificate/eligibility/2`.
- The gateway routes `/api/**` to the evaluation service, so the frontend calls `http://localhost:8080/api/certificate/eligibility/2` (gateway port).
- The controller only delegates to the service and returns the DTO with status 200.

---

## 8. Frontend – API service (calling the backend)

**File:** `frontend/src/app/core/services/evaluation-api.service.ts`

**Constants / base URL:**  
`const API_URL = 'http://localhost:8080/api';`

**New methods:**

```typescript
getUserById(id: number): Observable<User> {
  return this.http.get<User>(`${API_URL}/users/${id}`);
}

getCertificateEligibility(userId: number): Observable<CertificateEligibilityResponse> {
  return this.http.get<CertificateEligibilityResponse>(`${API_URL}/certificate/eligibility/${userId}`);
}
```

**CertificateEligibilityResponse** (interface in the same service or types file):

- `eligible: boolean`
- `passedCount: number`
- `passedEvaluationTitles?: string[]` – titles of the evaluations the user passed (shown on the certificate)
- `certificateScore?: number` – average score 0–100 used for level
- `level?: string` – A1, A2, B1, B2, C1, or C2

**Explanation:**

- **getUserById(id):**  
  Used to get the current user’s `name` and `surname` for the certificate text.

- **getCertificateEligibility(userId):**  
  Calls the endpoint and returns an observable of the full response. The component sets `eligible`, `passedCount`, `passedEvaluationTitles`, `certificateLevel` (from `level`), and shows the certificate with the list of passed evaluations and “Level achieved: X” when eligible.

---

## 9. Frontend – Certificate component (TypeScript)

**File:** `frontend/src/app/frontoffice/certificate/certificate.component.ts`

**Constants at top:**

```typescript
const PLATFORM_NAME = 'SlangEnglish';
const REQUIRED_PASSED = 5;
const MIN_PERCENT = 50;
```

**Component state:**

```typescript
loading = true;
eligible = false;
passedCount = 0;
studentName = '';
certificateDate = '';
passedEvaluationTitles: string[] = [];
certificateLevel = '';
```

**Explanation:**

- `loading`: true until we get the eligibility response (and optionally user).
- `eligible` / `passedCount`: come from the API.
- `studentName`: from `getUserById` (name + surname).
- `certificateDate`: formatted “today” for the certificate (e.g. “Monday, February 23, 2025”).

- `certificateDate`: formatted "today" for the certificate (e.g. "Monday, February 23, 2025").

- `passedEvaluationTitles`: list of evaluation titles the user passed (the 5+ that count for the certificate); shown on the certificate.
- `certificateLevel`: A1–C2 from the API when eligible; shown as "Level achieved: X".

**ngOnInit:**

```typescript
ngOnInit(): void {
  this.load();
}
```

Calls `load()` once when the page is opened.

**load():**

```typescript
load(): void {
  this.loading = true;
  const userId = this.currentUser.getUserId();
  this.api.getCertificateEligibility(userId).subscribe({
    next: (res) => {
      this.eligible = res.eligible;
      this.passedCount = res.passedCount;
      this.passedEvaluationTitles = res.passedEvaluationTitles ?? [];
      this.certificateLevel = res.level ?? '';
      this.certificateDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.loadStudentName(userId);
      this.loading = false;
    },
    error: () => {
      this.loading = false;
      this.snackBar.open('Failed to load certificate status', 'Close', { duration: 3000 });
      this.router.navigate(['/frontoffice/evaluations']);
    }
  });
}
```

**Explanation:**

- Gets `userId` from `CurrentUserService`.
- Calls `getCertificateEligibility(userId)`. On success:  
  - Sets `eligible`, `passedCount`, `passedEvaluationTitles`, and `certificateLevel` (from `res.level`).  
  - Sets `certificateDate` to a long, readable date (e.g. “Monday, February 23, 2025”).  
  - Calls `loadStudentName(userId)` to fetch name/surname (async, so the certificate may show “Student” briefly then update).  
  - Sets `loading = false`.  
- On error: stop loading, show snackbar, redirect to evaluations list.

**loadStudentName(userId):**

```typescript
private loadStudentName(userId: number): void {
  this.api.getUserById(userId).subscribe({
    next: (user) => {
      this.studentName = [user.name, user.surname].filter(Boolean).join(' ') || 'Student';
    },
    error: () => {
      this.studentName = 'Student';
    }
  });
}
```

**Explanation:**

- Fetches the user by ID.  
- Builds display name from `name` and `surname`; if both missing, uses `'Student'`.  
- On error, still use `'Student'` so the certificate never breaks.

**Getters used in the template:**

```typescript
get platformName(): string {
  return PLATFORM_NAME;
}

get congratulationMessage(): string {
  if (this.passedCount >= REQUIRED_PASSED) {
    return `Congratulations! You have successfully passed ${this.passedCount} evaluation${this.passedCount === 1 ? '' : 's'} with ${MIN_PERCENT}% or above.`;
  }
  return `Keep going! You have passed ${this.passedCount} out of ${REQUIRED_PASSED} evaluations with ${MIN_PERCENT}% or above.`;
}

get requiredPassed(): number {
  return REQUIRED_PASSED;
}
```

**Explanation:**

- **platformName:** Always “SlangEnglish” (used in header and seal).
- **congratulationMessage:**  
  - If eligible: “Congratulations! You have successfully passed X evaluations with 50% or above.”  
  - If not: “Keep going! You have passed X out of 5 evaluations with 50% or above.”
- **requiredPassed:** Returns 5 so the template can show “X/5” and “Pass (5 − X) more…”.

**Navigation:**

```typescript
backToEvaluations(): void {
  this.router.navigate(['/frontoffice/evaluations']);
}
```

Used by both the certificate view and the “not eligible” view.

---

## 10. Frontend – Certificate template (HTML)

**File:** `frontend/src/app/frontoffice/certificate/certificate.component.html`

**Structure in words:**

1. **Loading:**  
   If `loading`, show a spinner and “Loading…”.

2. **When not loading:**  
   - **If eligible:**  
     - Show the certificate card (platform name, “Certificate of Achievement”, “This is to certify that”, student name, congratulation message, date, level achieved A1–C2 when present, list of passed evaluation titles, seal with SlangEnglish).  
     - Show “Back to evaluations” button.  
   - **If not eligible:**  
     - Show “Certificate not yet available”, the same congratulation message (X/5), a progress bar, hint “Pass N more…”, and “Go to evaluations” button.

**Relevant snippets:**

**Loading:**

```html
<div class="loading-state" *ngIf="loading">
  <mat-icon class="spin">refresh</mat-icon>
  <p>Loading...</p>
</div>
```

**Certificate (eligible):**

The certificate div has `#certificateEl` so the component can pass it to html2pdf. When eligible it shows **Level achieved: X** (from `certificateLevel`, A1–C2) and **Passed evaluations (required for this certificate):** with a list of `passedEvaluationTitles`. The actions row has "Export PDF" and "Back to evaluations".

```html
<div class="certificate-wrapper" *ngIf="eligible">
  <div class="certificate" #certificateEl>
    <div class="certificate-border">
      <div class="certificate-inner">
        <div class="certificate-header">
          <div class="platform-logo">{{ platformName }}</div>
          <div class="certificate-badge">
            <mat-icon>verified</mat-icon>
            <span>Certificate of Achievement</span>
          </div>
        </div>
        <div class="certificate-body">
          <p class="certificate-label">This is to certify that</p>
          <h1 class="student-name">{{ studentName }}</h1>
          <p class="congrats-message">{{ congratulationMessage }}</p>
          <p class="certificate-level" *ngIf="certificateLevel">
            <span class="level-label">Level achieved:</span>
            <strong class="level-value">{{ certificateLevel }}</strong>
          </p>
          <div class="passed-evaluations" *ngIf="passedEvaluationTitles.length > 0">
            <p class="passed-evaluations-label">Passed evaluations (required for this certificate):</p>
            <ul class="passed-evaluations-list">
              <li *ngFor="let title of passedEvaluationTitles">{{ title }}</li>
            </ul>
          </div>
          <p class="certificate-date">{{ certificateDate }}</p>
        </div>
        <div class="certificate-footer">
          <div class="seal">
            <mat-icon>school</mat-icon>
            <span>{{ platformName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="certificate-actions">
    <button mat-raised-button class="export-pdf-btn" (click)="exportPdf()" [disabled]="exportingPdf">
      <mat-icon>picture_as_pdf</mat-icon>
      {{ exportingPdf ? 'Exporting...' : 'Export PDF' }}
    </button>
    <button mat-raised-button class="back-btn" (click)="backToEvaluations()">
      <mat-icon>arrow_back</mat-icon>
      Back to evaluations
    </button>
  </div>
</div>
```

- **platformName** = “SlangEnglish” (header + seal).  
- **studentName** = from API (name + surname).  
- **congratulationMessage** = success or progress text.  
- **certificateLevel** = A1–C2 from API when eligible; shown as "Level achieved: X".
- **passedEvaluationTitles** = list of evaluation titles the user passed; shown as a bullet list.
- **certificateDate** = long date set in `load()`.

**Not eligible:**

```html
<div class="not-eligible" *ngIf="!eligible">
  <div class="not-eligible-card">
    <mat-icon class="icon-lock">lock</mat-icon>
    <h2>Certificate not yet available</h2>
    <p class="progress-text">{{ congratulationMessage }}</p>
    <div class="progress-bar-wrap">
      <div class="progress-fill" [style.width.%]="(passedCount / requiredPassed) * 100"></div>
    </div>
    <p class="hint">Pass {{ requiredPassed - passedCount }} more evaluation(s) with 50% or above to unlock your {{ platformName }} certificate.</p>
    <button mat-raised-button class="back-btn" (click)="backToEvaluations()">
      <mat-icon>assignment</mat-icon>
      Go to evaluations
    </button>
  </div>
</div>
```

- Progress bar width = `(passedCount / 5) * 100` percent.  
- Hint uses `requiredPassed - passedCount` (how many more to pass).

---

## 10.5 Export PDF (certificate only)

When the user is **eligible**, they see an **"Export PDF"** button next to "Back to evaluations". Clicking it downloads the certificate as a PDF (e.g. `SlangEnglish-Certificate-John-Doe.pdf`).

**How it works:**

- **File:** `certificate.component.ts`  
  - `@ViewChild('certificateEl')` references the certificate div.  
  - `exportingPdf` disables the button and shows "Exporting..." while generating.  
  - `exportPdf()` dynamically imports `html2pdf.js`, then calls it with the certificate element and options (A4, scale 2, margin 10, JPEG quality 0.98). On success: snackbar "Certificate exported as PDF". On error: snackbar "Failed to export PDF" and console error.

- **File:** `certificate.component.html`  
  - The certificate div has `#certificateEl`.  
  - The actions row (class `certificate-actions`) contains the Export PDF button and the Back button.

- **Dependency:** `html2pdf.js` in `frontend/package.json`. It uses html2canvas and jsPDF to capture the certificate DOM and save as PDF.

---

## 11. Frontend – Certificate styles (CSS)

**File:** `frontend/src/app/frontoffice/certificate/certificate.component.css`

**What each part does:**

- **.certificate-page:**  
  Container with padding and a short fade-in animation.

- **.loading-state:**  
  Centered spinner and “Loading…” text; `.spin` rotates the icon.

- **.certificate-wrapper:**  
  Max width 720px, centered; wraps the whole certificate block.

- **.certificate:**  
  Parchment-like gradient background (`#faf8f3` → `#f5f0e6`), rounded corners, shadow so it looks like a sheet of paper.

- **.certificate-border:**  
  Gold border (`#c9a227`), inner padding; `::before` adds a subtle inner border for a “frame” effect.

- **.certificate-header:**  
  Centered; platform name (SlangEnglish) in large serif; “Certificate of Achievement” with verified icon; bottom border.

- **.platform-logo:**  
  Uppercase, letter-spacing, Georgia/serif, dark color.

- **.certificate-body:**  
  “This is to certify that”, then student name (big serif), then congratulation message, then date in italic.

- **.student-name:**  
  Large (36px), bold, serif.

- **.certificate-footer:**  
  Top border; contains the “seal” (circle with gradient, school icon, “SlangEnglish” text).

- **.seal:**  
  Round badge with purple gradient, white text/icon.

- **.back-btn:**  
  Purple gradient button, used for “Back to evaluations” and “Go to evaluations”.

- **.not-eligible / .not-eligible-card:**  
  Centered card with lock icon, title, progress text, progress bar, hint, and button.

- **.certificate-actions:** Flex container with gap; wraps the Export PDF and Back buttons below the certificate.

- **.export-pdf-btn:** Gold-style button for Export PDF; when disabled (during export) opacity 0.7.

- **.progress-bar-wrap / .progress-fill:**  
  Grey track; fill is a gradient (purple) and width is bound in the template to `(passedCount/requiredPassed)*100`.

- **@media (max-width: 600px):**  
  Reduces padding and font sizes so the certificate stays readable on small screens.

---

## 12. Frontend – Routing (how we reach the certificate page)

**File:** `frontend/src/app/frontoffice/frontoffice-routing.module.ts`

**Import:**

```typescript
import { CertificateComponent } from './certificate/certificate.component';
```

**Route (inside the layout children):**

```typescript
{ path: 'certificate', component: CertificateComponent }
```

**Explanation:**

- Frontoffice routes are under the layout (sidebar + content).  
- Path `certificate` means URL: `/frontoffice/certificate`.  
- When the user goes to that URL, Angular loads `CertificateComponent` inside the layout’s router outlet.

---

## 13. Frontend – Module declaration

**File:** `frontend/src/app/frontoffice/frontoffice.module.ts`

**Import:**

```typescript
import { CertificateComponent } from './certificate/certificate.component';
```

**Declaration:**

```typescript
declarations: [
  // ... other components
  CertificateComponent
],
```

**Explanation:**

- So Angular knows about `CertificateComponent` and can use it in the route and in templates.  
- The certificate template uses `mat-icon` and `mat-raised-button`, which come from `SharedModule` (or Material modules) already imported in the frontoffice module.

---

## 14. Frontend – Sidebar menu (how the user opens the certificate)

**File:** `frontend/src/app/frontoffice/layout/layout.component.ts`

**Menu item added:**

```typescript
frontofficeMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', routerLink: '/frontoffice/dashboard' },
  { id: 'evaluations', label: 'Evaluations', icon: 'assignment', routerLink: '/frontoffice/evaluations' },
  { id: 'certificate', label: 'My Certificate', icon: 'workspace_premium', routerLink: '/frontoffice/certificate' },
  { id: 'profile', label: 'Profile', icon: 'person', routerLink: '/frontoffice/profile' },
  // ...
];
```

**Explanation:**

- “My Certificate” appears in the sidebar with a trophy-style icon (`workspace_premium`).  
- Clicking it navigates to `/frontoffice/certificate`, which loads the certificate component.  
- The component then calls the API and shows either the certificate (if eligible) or the progress view (if not).

---

## 15. End-to-end flow (summary)

1. **User** clicks “My Certificate” in the sidebar → navigates to `/frontoffice/certificate`.
2. **CertificateComponent** runs `ngOnInit()` → `load()`.
3. **load()** gets `userId` from `CurrentUserService`, then calls **getCertificateEligibility(userId)**.
4. **Backend** receives `GET /api/certificate/eligibility/{userId}`:
   - Loads all SUBMITTED attempts for that user with evaluation (repository).
   - For each attempt, if `score / evaluation.totalScore >= 0.5`, adds that evaluation’s ID to a set (service).
   - `passedCount` = set size; `eligible` = (passedCount >= 5).
   - Returns `{ eligible, passedCount }`.
5. **Frontend** receives the response:
   - Sets `eligible`, `passedCount`, and `certificateDate`.
   - Calls **getUserById(userId)** to get name/surname and sets `studentName`.
   - Sets `loading = false`.
6. **Template**:
   - If `eligible`: shows the certificate (SlangEnglish, student name, congratulation message, date, seal) and “Back to evaluations”.
   - If not: shows “Certificate not yet available”, progress message, progress bar (passedCount/5), hint, and “Go to evaluations”.

That is the complete certificate feature from rule to UI, with every file and logic step covered.
