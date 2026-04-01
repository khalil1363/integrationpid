# Certificate QR Code and Verification Page – Code and Explanation

This document explains the **QR code on the certificate** and the **verification page** that opens when someone scans it. It follows the same style as `HOW_CERTIFICATE_WORKS.md` and `HOW_WARNINGS_AND_DAYS_LEFT_WORK.md`: code reference first, then code blocks with explanations.

---

## 1. Code reference (files involved)

| File | Role |
|------|------|
| `frontend/src/app/frontoffice/certificate/certificate.component.ts` | Adds getter `verificationUrl`: builds the URL for the QR code (origin + `/frontoffice/certificate/verify?name=...&date=...` and optionally `&level=...` when the certificate has a level). |
| `frontend/src/app/frontoffice/certificate/certificate.component.html` | Renders the QR code in the certificate footer (next to the seal) using `<qrcode>`, and the text "Scan to verify". |
| `frontend/src/app/frontoffice/certificate/certificate.component.css` | Styles for `.footer-row`, `.qrcode-block`, `.qrcode-hint` so the seal and QR sit side by side. |
| `frontend/src/app/frontoffice/certificate/certificate-verify.component.ts` | CertificateVerifyComponent: reads query params `name`, `date`, and optionally `level`; sets `studentName`, `certificateDate`, and `level` for the template. |
| `frontend/src/app/frontoffice/certificate/certificate-verify.component.html` | Verification page content: SlangEnglish logo, paragraph "We certify that [name] passed the evaluation successfully.", optional "Level achieved: X", date, signature line, seal. |
| `frontend/src/app/frontoffice/certificate/certificate-verify.component.css` | Full-page layout and card styles for the verify view (logo, statement, signature, seal). |
| `frontend/src/app/frontoffice/frontoffice-routing.module.ts` | Adds route `certificate/verify` (no layout) so the verify page is a standalone full page. |
| `frontend/src/app/frontoffice/frontoffice.module.ts` | Declares `CertificateVerifyComponent` and imports `QRCodeModule` (angularx-qrcode). |
| `frontend/package.json` | Dependency: `angularx-qrcode` (QR code generation). |
| `frontend/src/index.html` | Optional: Google Font "Dancing Script" for the signature line on the verify page. |

---

## 2. What the user sees when they scan the QR code

When someone scans the QR code on the certificate:

1. Their device opens the URL encoded in the QR (e.g. `https://your-domain.com/frontoffice/certificate/verify?name=John+Doe&date=Monday%2C+February+23%2C+2025` and optionally `&level=B2`).
2. The **verification page** loads (no sidebar, full page) and shows:
   - **SlangEnglish** logo (same style as the certificate).
   - Paragraph: **"We are SlangEnglish. We certify that [student name] passed the evaluation successfully."**
   - When the URL includes a `level` param (A1–C2), a line **"Level achieved: X"**.
   - The **certificate date**.
   - A **signature line** with the label "SlangEnglish Director" (cursive-style font).
   - The **SlangEnglish seal** (round badge with platform name).

So the QR code links to a short, public verification view that confirms the certificate and shows the student name and date.

---

## 3. Verification URL (certificate component)

**File:** `certificate.component.ts`

The QR code must point to a URL that includes the student name and date. We build that URL in a getter so it stays in sync with the current certificate data.

```typescript
/** URL that the QR code points to: verification page with student name, date, and optional level. */
get verificationUrl(): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const name = encodeURIComponent(this.studentName || 'Certificate Holder');
  const date = encodeURIComponent(this.certificateDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  let url = `${base}/frontoffice/certificate/verify?name=${name}&date=${date}`;
  if (this.certificateLevel) {
    url += `&level=${encodeURIComponent(this.certificateLevel)}`;
  }
  return url;
}
```

**Explanation:**

- `window.location.origin` is the site’s base URL (e.g. `https://example.com`). The check `typeof window !== 'undefined'` avoids errors in SSR or non-browser environments.
- `encodeURIComponent` ensures the name and date are safe in the query string (spaces, commas, etc.).
- The path `/frontoffice/certificate/verify` matches the route we added for the verification page. Query params `name`, `date`, and optionally `level` (A1–C2) are read by the verify component; when the certificate has a level, it is appended so the verify page can show "Level achieved: X".

---

## 4. QR code in the certificate template

**File:** `certificate.component.html`

The certificate footer has a row that shows the seal and the QR code side by side.

```html
<div class="certificate-footer">
  <div class="footer-row">
    <div class="seal">
      <mat-icon>school</mat-icon>
      <span>{{ platformName }}</span>
    </div>
    <div class="qrcode-block">
      <qrcode [qrdata]="verificationUrl" [width]="96" [errorCorrectionLevel]="'M'"></qrcode>
      <p class="qrcode-hint">Scan to verify</p>
    </div>
  </div>
  <p class="awarded-to">Awarded to <strong>{{ studentName || 'Certificate Holder' }}</strong></p>
</div>
```

**Explanation:**

- `qrcode` is the component from **angularx-qrcode** (`QRCodeModule`). It generates a QR image from the string you pass.
- `[qrdata]="verificationUrl"` uses the getter above so the QR encodes the verification URL with the current student name and date.
- `[width]="96"` sets the size of the QR in pixels.
- `[errorCorrectionLevel]="'M'"` uses medium error correction so the QR remains readable even if the print or screen is slightly damaged.
- "Scan to verify" is a short hint under the QR.

---

## 5. Certificate footer styles (seal + QR)

**File:** `certificate.component.css`

```css
.footer-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}

.qrcode-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.qrcode-block qrcode {
  display: block;
}

.qrcode-hint {
  font-size: 11px;
  color: #666;
  margin: 0;
}
```

**Explanation:**

- `.footer-row` puts the seal and the QR in a horizontal row, centered, with space between them; it wraps on small screens.
- `.qrcode-block` stacks the QR and the "Scan to verify" text vertically.
- `.qrcode-hint` keeps the hint small and grey so it doesn’t dominate the certificate.

---

## 6. Verification page component (TypeScript)

**File:** `certificate-verify.component.ts`

The verification page is a separate component that reads the query params and sets the text for the template.

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

const PLATFORM_NAME = 'SlangEnglish';

@Component({
  selector: 'app-certificate-verify',
  templateUrl: './certificate-verify.component.html',
  styleUrls: ['./certificate-verify.component.css']
})
export class CertificateVerifyComponent implements OnInit {
  studentName = '';
  certificateDate = '';
  level = '';
  platformName = PLATFORM_NAME;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.studentName = params['name'] || 'Certificate Holder';
      this.certificateDate = params['date'] || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.level = params['level'] || '';
    });
  }
}
```

**Explanation:**

- `ActivatedRoute` gives access to the URL. We subscribe to `queryParams` so we react to `?name=...&date=...`.
- `name` is shown as the certified student; if missing, we use "Certificate Holder".
- `date` is shown as the certificate date; if missing, we use today’s date in long format.
- `platformName` is used for the logo and seal text (SlangEnglish).

---

## 7. Verification page template (HTML)

**File:** `certificate-verify.component.html`

```html
<div class="verify-page">
  <div class="verify-card">
    <div class="verify-logo">{{ platformName }}</div>
    <p class="verify-intro">We are <strong>SlangEnglish</strong>.</p>
    <p class="verify-statement">
      We certify that <strong>{{ studentName }}</strong> passed the evaluation successfully.
    </p>
    <p class="verify-level" *ngIf="level">Level achieved: <strong>{{ level }}</strong></p>
    <p class="verify-date">{{ certificateDate }}</p>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-label">SlangEnglish Director</p>
    </div>
    <div class="verify-seal">
      <span class="seal-text">{{ platformName }}</span>
    </div>
  </div>
</div>
```

**Explanation:**

- **verify-logo:** Same platform name as on the certificate (SlangEnglish), styled as the main logo.
- **verify-intro:** Short line "We are SlangEnglish."
- **verify-statement:** The main sentence: "We certify that [student name] passed the evaluation successfully."
- **verify-level:** When the URL has a `level` param (A1–C2), shows "Level achieved: X".
- **verify-date:** The certificate date from the URL (or today).
- **signature-block:** A horizontal line (signature line) and the label "SlangEnglish Director" in a cursive-style font to simulate a signature.
- **verify-seal:** A circular seal with the platform name, matching the certificate’s seal style.

---

## 8. Verification page styles (CSS)

**File:** `certificate-verify.component.css`

- **.verify-page:** Full viewport height, centered content, background gradient similar to the certificate.
- **.verify-card:** White/cream card with gold border, rounded corners, shadow (same feel as the certificate).
- **.verify-logo:** Uppercase, serif, large (SlangEnglish branding).
- **.verify-statement strong:** Student name in gold (#c9a227) to match the certificate.
- **.signature-line:** A simple line (e.g. 180px wide) where a signature would go.
- **.signature-label:** Cursive font (e.g. Dancing Script) for "SlangEnglish Director".
- **.verify-seal:** Round badge with purple gradient and platform name (same as certificate seal).

The exact class names and values are in `certificate-verify.component.css`; the idea is to keep the verify page visually consistent with the certificate (logo, seal, colours).

---

## 9. Routing (verify page without layout)

**File:** `frontoffice-routing.module.ts`

The verification page is a **standalone full page** (no sidebar or main layout) so that when someone scans the QR they only see the verification content.

```typescript
const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // ... dashboard, certificate, etc.
      { path: 'certificate', component: CertificateComponent }
    ]
  },
  { path: 'certificate/verify', component: CertificateVerifyComponent }
];
```

**Explanation:**

- Routes under `path: ''` use `LayoutComponent` (sidebar, header, etc.).
- `certificate/verify` is **outside** that layout, so it has no sidebar. The URL is `/frontoffice/certificate/verify?name=...&date=...`.

---

## 10. Module and dependency

**File:** `frontoffice.module.ts`

- **Declarations:** Add `CertificateVerifyComponent`.
- **Imports:** Add `QRCodeModule` from `angularx-qrcode` so the certificate template can use `<qrcode>`.

**File:** `package.json`

- **Dependency:** `"angularx-qrcode": "18.0.2"` (or the version you use). This library generates the QR image from the verification URL.

---

## 11. Summary

| What | How |
|------|-----|
| QR on certificate | `<qrcode [qrdata]="verificationUrl" ...>` in the certificate footer; `verificationUrl` getter builds the URL with name, date, and optionally level. |
| Verification URL | `origin + '/frontoffice/certificate/verify?name=' + encodeURIComponent(name) + '&date=' + encodeURIComponent(date)` + optional `'&level=' + encodeURIComponent(level)`. |
| Verify page content | SlangEnglish logo, "We certify that [name] passed the evaluation successfully.", optional "Level achieved: X" when `level` is in the URL, date, signature line ("SlangEnglish Director"), seal. |
| Verify page route | `certificate/verify` under frontoffice, no layout, so it’s a full-page view when opened from the QR. |
| Signature | A horizontal line + label "SlangEnglish Director" in a cursive font (e.g. Dancing Script). |

All of this is implemented in the frontend; no backend change is required for the QR or the verification page.
