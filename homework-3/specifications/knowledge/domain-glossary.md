# Domain Glossary — Virtual Card Lifecycle

Canonical terms. When a spec, plan, task, or contract uses one of these words, it means exactly
what is written here. Linked from [[00-constitution]] and used across `product/` and `architecture/`.

| Term | Definition |
|------|------------|
| **Virtual card** | A card number issued digitally (no physical plastic) bound to a funding account and a cardholder. Has its own lifecycle state, limits, and transaction history. |
| **PAN** (Primary Account Number) | The 16-digit card number. **Sensitive** — full PAN never leaves the PCI boundary (see [[00-constitution]] Principle 2). |
| **network token** | A non-sensitive surrogate for the PAN provided by the card network / token vault. Used for authorization and for referencing a card in our own systems. Safe to store and log. |
| **last4** | The last four digits of the PAN. The only PAN fragment shown to users/ops. Safe to display. |
| **CVV / CVC** | Card verification value. Never stored after authorization; never logged. |
| **Cardholder / end-user** | The customer who owns the card and performs spend actions on their own cards. |
| **Ops / compliance user** | Internal actor with read access and scoped intervention powers (e.g. compliance freeze, dispute review). Cannot spend on a user's behalf. |
| **Fraud service** | External/internal system that scores authorizations and may trigger an automatic freeze. |
| **Funding account** | The account that backs the card and against which spend is settled. Out of scope to build, referenced by id. |
| **Lifecycle state** | One of `CREATED`, `ACTIVE`, `FROZEN`, `CLOSED` (see [[domain-business-rules]] state machine). |
| **Spending limit** | A cap on spend over a window: `per_transaction`, `daily`, `monthly`. Stored in minor units + currency. |
| **Authorization (auth)** | A real-time request to spend against a card. Approved or declined; may later clear/settle. Read-only to this feature (we evaluate limits and state, we do not build the auth network). |
| **Transaction** | A recorded auth/clearing/refund event visible in the card's history. |
| **Idempotency key** | Caller-supplied unique key that makes a write safe to retry with at-most-once effect (see [[00-constitution]] Principle 4). |
| **Audit event** | Append-only, tamper-evident record of a state change (see [[00-constitution]] Principle 3). |
| **Minor units** | Integer smallest currency unit (e.g. cents). Canonical money representation. |
| **Compliance freeze** | A freeze applied by ops/compliance or fraud that the end-user **cannot** self-unfreeze. |
| **KYC** | Know Your Customer — identity verification status of the cardholder; a precondition for issuance. |
| **SoD** | Separation of Duties — no single actor can both request and approve a sensitive action. |
| **SCA** | Strong Customer Authentication — step-up auth required for sensitive actions (regulatory, e.g. PSD2). |
