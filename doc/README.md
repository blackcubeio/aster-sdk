# @blackcube/aster-sdk — Documentation

TypeScript SDK for the [Aster](https://www.asterdex.com) exchange (perpetuals & spot DEX on
Aster L1 / BNB Chain). Organised like the [Aster API docs](https://github.com/asterdex/api-docs)
(V3).

## Contents

### REST API — futures (`/fapi/v3/*`)
- [Market data](./rest-api/futures-market.md) — public reads: exchange info, depth, trades, klines,
  mark price, funding, tickers, index references
- Trading & account *(roadmap — see [PLAN.md](../PLAN.md))*

### REST API — spot (`/api/v3/*`)
- *(roadmap — see [PLAN.md](../PLAN.md))*

### WebSocket
- [Futures market streams](./websocket/futures-streams.md) — real-time `fstream` streams

### Signing
- [Signing](./signing.md) — EIP-712 (secp256k1) agent signing, signer registry, nonce, and the
  open question on account-management signing

## Installation & initialisation

See the root [README](../README.md). The SDK is initialised once with `init()`; every call takes
a signer **label** as a trailing argument (optional for reads, mandatory for writes).

## Conventions

- **Public API in camelCase**; Aster's V3 wire is already camelCase, array-shaped responses are
  decoded into objects.
- **Amounts/prices are decimal strings.**
- Errors throw `AsterApiError` (`status`, `code`, `message`).
- Each function targets one **product** (`futures` or `spot`); the SDK picks the right host and
  network from the signer's label.
