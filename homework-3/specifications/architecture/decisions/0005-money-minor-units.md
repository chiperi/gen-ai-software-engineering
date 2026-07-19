# ADR-0005: Money as integer minor units, single currency per card

**Status:** accepted
**Date:** 2026-07-16
**Deciders:** Solution Architect · **Relates to:** [[00-constitution]] P1, spec FR-033, BR-007/021, D-04

## Context
Floating-point money causes rounding drift and reconciliation failures. The feature compares
authorization amounts to limits and sums window spend, so representation must be exact. Cross-currency
adds ambiguity we do not need (D-04).

## Decision
Represent all amounts as **integer minor units** (`BIGINT`) with an explicit ISO-4217 currency equal
to the card's currency. No floats anywhere in storage or comparison. One currency per card; a
different currency requires a separate card. At the presentation edge only, format using the
currency's exponent with banker's rounding applied exactly once.

## Consequences
- (+) Exact limit comparison and window sums; clean reconciliation (MO-4 verification).
- (+) No cross-currency arithmetic paths to secure or test.
- (−) Callers must send minor units; validation rejects non-integer/negative (E-20).
- (−) Multi-currency users hold multiple cards; accepted product trade-off (D-04).
