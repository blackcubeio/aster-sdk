# @blackcube/aster-sdk

TypeScript SDK for the [Aster](https://www.asterdex.com) exchange — perpetuals & spot DEX on
Aster L1 / BNB Chain. REST (futures & spot **V3**), WebSocket market streams, and EIP-712 agent
signing. Same shape as [`@blackcube/hyperliquid-sdk`](https://github.com/blackcubeio/hyperliquid-sdk)
and [`@blackcube/pacifica-sdk`](https://github.com/blackcubeio/pacifica-sdk).

> **V3 only.** Aster V1 (API key + HMAC) no longer accepts new API keys since 2026-03-25. This SDK
> targets the V3 API wallet / agent model exclusively.

## Installation

```bash
pnpm add @blackcube/aster-sdk
```

Works in Node.js (≥ 22) and the browser (crypto via `@noble`).

## Initialisation

The SDK is initialised **once**; the whole API inherits the configuration.

```ts
import { init } from '@blackcube/aster-sdk';

init();                                                          // reads only, mainnet fallback
init({
  signers: {
    trader: { privateKey, user, network: 'mainnet' },            // a mainnet signer
    tester: { privateKey, user, network: 'testnet' },            // a testnet signer
  },
});
```

| Option | Type | Default |
|---|---|---|
| `signers` | `Record<label, Signer>` | — (required for writes) |
| `fetch` | `FetchLike` | `globalThis.fetch` |
| `webSocket` | `WebSocketFactory` | `globalThis.WebSocket` |
| `restUrls` / `wsUrls` | `Record<Product, Record<Network, string>>` | per product & network |

Each `Signer` carries its own `network`, so mainnet and testnet coexist in one process. Calling
the API before `init()` throws `Aster SDK not initialized`. `resetConfig()` resets it.

## Two products

Aster exposes two products on distinct hosts; every REST/WS call targets one of them:

- **futures** — `fapi.asterdex.com` / `fstream.asterdex.com`, paths under `/fapi/v3/*`
- **spot** — `sapi.asterdex.com` / `sstream.asterdex.com`, paths under `/api/v3/*`

## The signer model (EVM)

Aster is an EVM DEX. A `Signer` ties a main account to its API wallet (agent):

- `privateKey` — the **API wallet** (agent) key. Signs all TRADE / USER_DATA actions.
- `user` — the **main account** address. Used for reads and account identity.
- `signer` — the API wallet address (derived from `privateKey` if omitted).
- `mainPrivateKey` — the **main wallet** key, required only by account-management endpoints
  (agent approval, sub-accounts, withdraw, migrate) which are signed by the main account.

## Labels, networks & read/write rules

Register one signer per **label** in `init({ signers })`. Every call takes the label as a trailing
argument:

- **Reads** (`getKlines`, `getMarkPrice`, market streams…) — label is **optional**. No label →
  **mainnet**; a label → that signer's network. `getMarkPrice('BTCUSDT', 'tester')`.
- **Writes** (`createOrder`…) — label is **mandatory** and throws if omitted. It selects both the
  wallet and the network: `createOrder(params, 'tester')`.

## Conventions

- **Public API in camelCase.** Aster's V3 wire is already camelCase; array-shaped responses
  (depth, klines, aggregate trades) are decoded into objects.
- **Amounts/prices are decimal strings** on the wire.
- Errors throw `AsterApiError` (`status`, `code`, `message`) — `code`/`msg` come from Aster's
  `{ "code": -1121, "msg": "…" }` envelope.
- Writes reference a registered signer by [label](./doc/signing.md).

## Documentation

See [`doc/`](./doc/README.md). Roadmap and endpoint inventory in [`PLAN.md`](./PLAN.md).

## License

BSD-3-Clause © Blackcube
