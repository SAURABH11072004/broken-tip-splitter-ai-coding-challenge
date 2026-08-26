# Broken Tip Splitter

A production-ready full-stack application built to solve the classic rounding and remainder distribution bug in bill splitters. It guarantees that the sum of all individual person shares matches the calculated grand total down to the exact cent:

$$\sum_{i=1}^{N} \text{PersonShare}_i \equiv \text{GrandTotal}$$

---

## Problem Overview

Most standard bill-splitting utilities suffer from floating-point arithmetic errors and naive per-person independent rounding. When splitting a bill with uneven numbers of people or fractional tips, independent rounding leads to lost or invented cents.

### Classic Failure Scenario:
- **Bill:** `$10.03`
- **Tip:** `0%`
- **Party Size:** `3 people`

#### Naive Algorithm:
$$\$10.03 / 3 = \$3.34333... \xrightarrow{\text{round}} \$3.34 \text{ per person}$$
$$\$3.34 + \$3.34 + \$3.34 = \$10.02 \quad \text{\textbf{(1 cent lost!)}}$$

---

## Core Solution & Mathematical Invariant

Our solution enforces **integer-cent calculations** and an **explicit remainder distribution strategy**:

1. **Parse Input Cleanly:** Convert floating-point currency directly into integer cents: $\text{billCents} = \text{round}(\text{billAmount} \times 100)$.
2. **Calculate Tip Once:** Calculate the tip for the entire bill once: $\text{tipCents} = \text{round}(\text{billCents} \times \text{tipPercentage} / 100)$.
3. **Calculate Grand Total:** $\text{grandTotalCents} = \text{billCents} + \text{tipCents}$.
4. **Integer Division for Base Share:** $\text{baseShareCents} = \lfloor \text{grandTotalCents} / \text{peopleCount} \rfloor$.
5. **Compute Remainder:** $\text{remainderCents} = \text{grandTotalCents} \pmod{\text{peopleCount}}$.
6. **Distribute Remainder Cents Fairly:** Allocate $+1¢$ to the first $\text{remainderCents}$ individuals; all others pay $\text{baseShareCents}$.
7. **Verify Invariant:** Strictly assert that $\sum \text{shares} \equiv \text{grandTotalCents}$.

### Corrected Result for $10.03 / 3:
- **Person 1:** `$3.35` ($334¢ + 1¢$)
- **Person 2:** `$3.34` ($334¢$)
- **Person 3:** `$3.34` ($334¢$)
- **Verified Sum:** $\$3.35 + \$3.34 + \$3.34 = \$10.03$

---

## Features

- **Mathematical Invariant Guarantee:** Never loses or creates cents across any bill amount, tip percentage, or party size.
- **Fair Remainder Distribution Banner:** Explicitly informs users who pays the extra cent(s) and why.
- **Person-by-Person Breakdown Table:** Semantic table detailing base share, extra cents, and final share per individual with sticky summary rows.
- **Live Reactive Calculation:** Instant client-side computation with shared business logic on every keystroke.
- **Full-Stack Persistence (SQLite + Prisma):** Save, load, update, and delete split calculations with relational share records.
- **Strict Two-Tier Validation:** Zod validation on both client forms and Express API endpoints.
- **Accessible & Responsive:** Fully keyboard navigable, WCAG-compliant contrast, ARIA landmarks and live regions, responsive desktop/mobile layout.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | SQLite |
| **Shared Core** | Pure TypeScript calculation engine, Zod schemas |
| **Testing** | Vitest, React Testing Library, Supertest, Fast-check Property-Based Fuzzing |

---

## Monorepo Architecture

```
broken-tip-splitter/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # SplitForm, BreakdownTable, SummaryCards, HistorySection, Header
│   │   ├── services/           # Typed API Client with timeout & error handling
│   │   ├── tests/              # Component and interaction tests
│   │   ├── App.tsx             # Root application orchestrator
│   │   └── main.tsx
│   └── package.json
├── server/                     # Express + Prisma Backend
│   ├── prisma/
│   │   └── schema.prisma       # SplitCalculation & SplitShare models
│   ├── src/
│   │   ├── controllers/        # CRUD handlers (GET, POST, PUT, DELETE)
│   │   ├── middleware/         # Structured JSON error handler
│   │   ├── routes/             # REST API routes
│   │   ├── tests/              # Supertest integration tests
│   │   ├── db.ts               # Prisma singleton
│   │   └── app.ts
│   └── package.json
├── shared/                     # Shared Pure Core
│   ├── src/
│   │   ├── calculator.ts       # calculateSplit() + remainder generator
│   │   ├── validation.ts       # Zod schemas + currency helpers
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── calculator.test.ts  # 14 unit + property-based fuzz tests (1000 runs)
│   └── package.json
├── .env.example
├── .gitignore
├── prompt.md
├── README.md
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js `>= 18.0.0`
- npm `>= 9.0.0`

### 1. Installation
Install all workspace dependencies from the root:
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```

### 3. Database Initialization
Generate Prisma client and push schema to local SQLite database:
```bash
npm run build --workspace=shared
npm --prefix server run prisma:generate
npm --prefix server run prisma:push
```

### 4. Running Locally
Start both backend (port `3001`) and frontend (port `5173` with proxy):
```bash
# Run server
npm run dev:server

# In another terminal, run client
npm run dev:client
```
Visit `http://localhost:5173` in your browser.

---

## Testing

Run all automated test suites across workspaces:
```bash
# Run all test suites
npm test

# Run shared core unit & invariant fuzz tests (14 tests, 1000 fuzz cases)
npm run test:shared

# Run server API integration tests (Supertest + SQLite)
npm run test:server

# Run client component & interaction tests (Vitest + Testing Library)
npm run test:client
```

---

## API Documentation

All endpoints return predictable, structured JSON responses:

### 1. Create Calculation
`POST /api/calculations`

**Request Body:**
```json
{
  "billAmount": "10.03",
  "tipPercentage": 15,
  "peopleCount": 3
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "c1f7215c-3f2d-4c31-97b7-95df4a7eb063",
    "billCents": 1003,
    "tipPercentage": 15,
    "tipCents": 150,
    "grandTotalCents": 1153,
    "peopleCount": 3,
    "baseShareCents": 384,
    "remainderCents": 1,
    "remainderExplanation": "1 extra cent was assigned to Person 1 so that all individual shares sum exactly to the grand total.",
    "shares": [
      { "personNumber": 1, "baseShareCents": 384, "extraCents": 1, "finalShareCents": 385 },
      { "personNumber": 2, "baseShareCents": 384, "extraCents": 0, "finalShareCents": 384 },
      { "personNumber": 3, "baseShareCents": 384, "extraCents": 0, "finalShareCents": 384 }
    ],
    "createdAt": "2026-08-26T12:35:00.000Z"
  }
}
```

### 2. Get Calculation History
`GET /api/calculations`

### 3. Get Single Calculation
`GET /api/calculations/:id`

### 4. Update Saved Calculation
`PUT /api/calculations/:id`

### 5. Delete Calculation
`DELETE /api/calculations/:id`

### Error Response Schema:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Bill amount must be greater than zero.",
    "details": []
  }
}
```

---

## Edge Cases Handled

1. **Zero Tip:** $50.00 bill @ 0% tip / 4 people $\rightarrow$ $12.50 each.
2. **One Person:** Bill + tip assigned entirely to single person with 0 remainder.
3. **Fractional Tip Rounding:** $10.03 @ 12.5% = $1.25375 $\rightarrow$ rounds to exact 125 cents ($1.25).
4. **Small Amount ($0.01 / 2 people):** Person 1 pays $0.01, Person 2 pays $0.00 $\rightarrow$ total $0.01.
5. **Small Amount ($1.00 / 3 people):** Person 1 pays $0.34, Persons 2 and 3 pay $0.33 $\rightarrow$ total $1.00.
6. **Large Parties:** Tested with 100+ people and large currency amounts.
7. **Invalid Currency Strings:** Rejects negatives, letters, zero, and currencies with >2 decimal places.

---

## Trade-offs & Future Work

### Trade-offs:
- **Remainder Assignment Order:** Currently assigns remainder cents to the first $N$ people (Person 1, 2, ...). In social dining, groups might prefer rotating who pays the cent or voluntary assignment.
- **SQLite Database:** Used SQLite for zero-setup local deployment. In a high-traffic production system, PostgreSQL with connection pooling would be preferred.

### Future Work:
- User authentication & multi-tenant calculation groups.
- Multi-currency support (EUR, GBP, JPY with zero-decimal currency support).
- Itemized bill splitting with custom item selection per person.
- PDF receipt export and shareable calculation URLs.
