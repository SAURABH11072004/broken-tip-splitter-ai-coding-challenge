# AI-Assisted Engineering Prompt Log: Broken Tip Splitter

This document logs the major engineering prompts, architectural queries, design decisions, and AI-assisted outcomes throughout the development lifecycle of the **Broken Tip Splitter** application.

---

### Step 1: Understanding the Problem & Requirements

**Developer Prompt:**
> "I need to build a bill splitter application where the primary requirement is that the sum of all individual shares must mathematically match the grand total to the exact cent ($SUM(\text{shares}) \equiv \text{grandTotal}$). Can you explain why standard tip calculators fail on inputs like \$10.03 split among 3 people?"

**AI Outcome & Guidance:**
Standard calculators suffer from two distinct problems:
1. **Floating-point rounding:** JavaScript numbers (IEEE 754 floating point) introduce representation errors during division (e.g., $10.03 / 3 = 3.3433333333333335$).
2. **Independent per-person rounding:** Rounding each person's share to two decimal places ($3.34$) leaves a leftover remainder ($3 \times \$3.34 = \$10.02$, losing $1¢$).
To fix this, we must adopt an integer-cent calculation engine with deterministic remainder distribution.

---

### Step 2: Identifying the Rounding Bug & Anti-Patterns

**Developer Prompt:**
> "What common architectural mistakes cause bill splitters to double-count tips or lose cents? What invariants must we establish?"

**AI Outcome & Guidance:**
Key anti-patterns identified:
- Calculating tip separately per person and summing rounded tip shares.
- Rounding base share and tip independently.
- Dividing float dollars directly.
**Core Invariant:** Tip must be calculated on the total bill exactly once, converted to integer cents, and added to integer bill cents to form `grandTotalCents`. The shares must sum to `grandTotalCents` without exception.

---

### Step 3: Choosing Integer-Cent Representation

**Developer Prompt:**
> "How should we model currency in TypeScript to eliminate floating-point imprecision?"

**AI Outcome & Guidance:**
Represent all monetary values internally as integer cents (`billCents`, `tipCents`, `grandTotalCents`, `baseShareCents`, `extraCents`, `finalShareCents`). Convert from dollars to cents via `Math.round(amount * 100)` at the boundary (Zod parsing / API input), execute all division using `Math.floor()` and `%`, and format to display currency only at the presentation layer.

---

### Step 4: Designing the MVP Architecture

**Developer Prompt:**
> "What is the cleanest monorepo structure to share the calculation engine between the React client and Express backend while maintaining strict separation of concerns?"

**AI Outcome & Guidance:**
Structured a 3-tier monorepo:
- `shared/`: Pure TypeScript calculation functions, invariant checks, Zod validation schemas, and types.
- `server/`: Express backend with Prisma ORM (SQLite) exposing RESTful CRUD endpoints.
- `client/`: Vite + React + Tailwind CSS client providing real-time local previews and persistence to SQLite.

---

### Step 5: Designing the Database Schema

**Developer Prompt:**
> "Design a relational Prisma schema for SQLite to store split calculations and their per-person share breakdowns with cascade deletion."

**AI Outcome & Guidance:**
Defined `SplitCalculation` (stores `billCents`, `tipPercentage`, `tipCents`, `grandTotalCents`, `peopleCount`, `baseShareCents`, `remainderCents`) with a 1-to-many relation to `SplitShare` (stores `personNumber`, `baseShareCents`, `extraCents`, `finalShareCents`) with `onDelete: Cascade`.

---

### Step 6: Designing the CRUD API

**Developer Prompt:**
> "Specify RESTful CRUD API endpoints for calculations, ensuring the backend is the authoritative source of truth."

**AI Outcome & Guidance:**
Implemented:
- `POST /api/calculations`: Validates input, calculates split, creates database records atomically.
- `GET /api/calculations`: Returns calculation history with nested shares ordered by date.
- `GET /api/calculations/:id`: Returns single calculation by ID with 404 handling.
- `PUT /api/calculations/:id`: Recalculates and updates calculation and shares in a Prisma transaction.
- `DELETE /api/calculations/:id`: Deletes calculation and cascades shares.

---

### Step 7: Separating Frontend, Backend, and Business Logic

**Developer Prompt:**
> "How do we ensure that frontend and backend do not duplicate calculation logic?"

**AI Outcome & Guidance:**
Extracted `calculateSplit(input)` into `@broken-tip-splitter/shared`. The frontend imports it for instant zero-latency UI preview as the user types; the backend imports it to execute authoritative database persistence.

---

### Step 8: Designing Input Validation with Zod

**Developer Prompt:**
> "Define robust Zod validation schemas for bill amounts (max 2 decimal places, positive), tip percentages (>= 0), and people counts (integer >= 1)."

**AI Outcome & Guidance:**
Created `splitInputSchema` and `splitCentsInputSchema` in `shared/src/validation.ts`. Added custom refinements to reject strings with >2 decimal places (e.g., `$10.005`) and validate whole integer party sizes.

---

### Step 9: Calculating Tips Correctly

**Developer Prompt:**
> "How should fractional-cent tips be handled? For instance, $10.03 at 15% gives 150.45 cents."

**AI Outcome & Guidance:**
Use standard half-up nearest-cent rounding on the total tip: `Math.round((billCents * tipPercentage) / 100)`.
For $10.03 @ 15%:
$$\text{tipCents} = \text{round}(1003 \times 15 / 100) = \text{round}(150.45) = 150¢ \text{ (\$1.50)}$$
$$\text{grandTotalCents} = 1003 + 150 = 1153¢ \text{ (\$11.53)}$$

---

### Step 10: Distributing Remainder Cents Fairly

**Developer Prompt:**
> "How should the remainder cents be distributed among people, and how should this be explained in the UI?"

**AI Outcome & Guidance:**
Given `baseShareCents = Math.floor(grandTotalCents / peopleCount)` and `remainderCents = grandTotalCents % peopleCount`:
- Allocate $+1¢$ to Person 1 through Person `remainderCents`.
- Generated dynamic human-readable explanations:
  - 0 remainder: *"The total divides evenly. No extra cents need to be assigned."*
  - 1 remainder: *"1 extra cent was assigned to Person 1 so that all individual shares sum exactly to the grand total."*
  - 2+ remainder: *"The total leaves N cents after equal division. One extra cent was assigned to Persons 1, 2, and ..."*

---

### Step 11: Designing the API Response Schema

**Developer Prompt:**
> "Create a standardized JSON response envelope for both success and error states."

**AI Outcome & Guidance:**
Standardized on `{ success: true, data: { ... } }` for success and `{ success: false, error: { code: 'VALIDATION_ERROR' | 'NOT_FOUND' | ..., message: '...' } }` for errors.

---

### Step 12: Handling Errors & Network Failures Gracefully

**Developer Prompt:**
> "How should the frontend handle backend unavailability or network timeouts without crashing?"

**AI Outcome & Guidance:**
Implemented custom `ApiError` with 10-second `AbortController` timeout in `client/src/services/api.ts`. Provided user-friendly fallback toast alerts: *"Unable to connect to the calculation service. Please check your connection and try again."*

---

### Step 13: Testing the Mathematical Invariant

**Developer Prompt:**
> "Write unit and property-based fuzz tests to verify that `sum(shares) === grandTotal` across 1,000 randomized bill and tip combinations."

**AI Outcome & Guidance:**
Created `shared/src/calculator.test.ts` with 14 test cases including even split, 1-cent remainder, multiple-cent remainder, 0% tip, 1 person, fractional tip, small bills ($0.01 / 2, $1.00 / 3), and a 1,000-iteration random fuzzing loop testing random bills ($0.01 to $10,000.00), random tips (0% to 100%), and random party sizes (1 to 200).

---

### Step 14: Testing API Persistence & Integration

**Developer Prompt:**
> "Write Supertest integration tests for all CRUD endpoints against a clean SQLite database."

**AI Outcome & Guidance:**
Created `server/src/tests/api.test.ts` verifying health check, calculation creation, reading history, reading by ID, 404 responses, updates with share recalculations, cascade deletion, and invalid payload rejection.

---

### Step 15: Reviewing Code Quality & Accessibility

**Developer Prompt:**
> "Ensure the UI is WCAG-compliant, accessible, and features a rich modern design."

**AI Outcome & Guidance:**
Added accessible `label` tags linked via `htmlFor`, `aria-describedby` for error states, semantic `table` with `scope="col"` and `scope="row"`, keyboard navigation support, high contrast ratios, and screen-reader status announcements.

---

### Step 16: Reviewing Security and Environment Variables

**Developer Prompt:**
> "Check that no credentials or secrets are leaked and environment variables are properly documented."

**AI Outcome & Guidance:**
Verified `.env` is ignored in `.gitignore`, provided comprehensive `.env.example`, and configured parameterized SQLite connections via Prisma.

---

### Step 17: Writing Documentation

**Developer Prompt:**
> "Generate a complete, professional README.md with problem analysis, architecture, setup instructions, and algorithm breakdown."

**AI Outcome & Guidance:**
Created root `README.md` containing detailed step-by-step mathematical examples, setup guides, API specs, and edge case coverage.

---

### Step 18: Final Challenge Verification

**Developer Prompt:**
> "Run full end-to-end builds, unit tests, integration tests, and client test suites to ensure zero errors."

**AI Outcome & Guidance:**
All 14 shared core tests, 8 backend integration tests, and client component tests passed with 100% success rate, confirming the invariant $\sum \text{Person Shares} \equiv \text{Grand Total}$.
