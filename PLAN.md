# Aster SDK — Plan & endpoint inventory

Built on the proven model of `@blackcube/hyperliquid-sdk` and `@blackcube/pacifica-sdk`. Source of
truth for the API: [`asterdex/api-docs`](https://github.com/asterdex/api-docs) (V3). Working copies
of the specs are in `.ref/` (gitignored).

## Scope decisions

- **V3 only.** V1 (HMAC) is deprecated (no new keys since 2026-03-25).
- **EVM only.** Aster also accepts Solana (ed25519/base58) agent addresses; out of scope for now.
- **Two products**, distinct hosts: futures (`fapi`/`fstream`, `/fapi/v3/*`) and spot
  (`sapi`/`sstream`, `/api/v3/*`).

## Architecture (mirrors the reference SDKs)

```
src/
  common/    constants · types · config (init/getConfig/resetConfig) · utils (nonce, serialize)
  rest/
    client.ts      httpGet / httpPostForm, AsterApiError, resolveReadNetwork
    signing.ts     EIP-712 secp256k1, resolveSigner, buildSignedRequest
    futures/  types.ts + market/ · trade/ · account/ · subaccount/ · asset/ · agent/ · user-stream/
    spot/     types.ts + market/ · trade/ · account/ · user-stream/
  ws/        futures-client.ts (fstream) · spot-client.ts (sstream)
  index.ts   barrel
```

One file per endpoint, wire→camelCase mapping, signer registry by **label** (network per signer).

## Roadmap (phased, validated between phases)

- **Phase 1 — Foundation + futures market — ✅ DONE (this branch `feature/aster-sdk-init`)**
  Configs, `common`, `client`, `signing` (agent), futures market data (17 endpoints), futures WS
  market streams, witness `createOrder`, signing unit tests, docs.
- **Phase 2 — Futures trading.** newOrder (full), modify, chase, batch, cancel (×4), countdown,
  positionMode/STP/multiAssets get+set, leverage, marginType, isolated margin, strategy orders,
  futures↔spot transfer. → exercises agent signing end-to-end on testnet.
- **Phase 3 — Futures account (USER_DATA reads).** balance, account info, position info, trades,
  income, leverage brackets, ADL, force orders, commission, margin history, query/open/all orders,
  MMP (×4). User-data WebSocket (`listenKey`).
- **Phase 4 — Account management (main-wallet signed).** ⚠️ blocked on empirically validating the
  main-wallet signing scheme (chainId 56 vs 1666, dynamic-typed vs `Message{msg}`). Covers
  registerAndApproveAgent, approve/update/del/get agent, builders, sub-accounts (×5), asset
  migrate (×2), withdraw.
- **Phase 5 — Spot.** market (13), trade (8: order, cancel, query, open/all orders, cancel-all,
  perp-spot transfer, withdraw + fee), account (info, trades), spot WS streams + user-data.

## Endpoint inventory

### Futures — market data (Phase 1 ✅)
ping · time · exchangeInfo · depth · trades · historicalTrades · aggTrades · klines ·
indexPriceKlines · markPriceKlines · premiumIndex (markPrice) · fundingRate · fundingInfo ·
ticker/24hr · ticker/price · ticker/bookTicker · indexreferences. *(Noop → Phase 2, paired with
order placement.)*

### Futures — trade (Phase 2)
order · modifyOrder · chaseOrder (`order/chase`) · batchOrders · cancelOrder · cancelAllOpenOrders ·
batch cancel · countdownCancelAll (auto-cancel) · positionSide/dual (get+set) · stpMode (get+set) ·
multiAssetsMargin (get+set) · leverage · marginType · positionMargin (+history) · strategy order
(place/update/query open/query history) · futures↔spot transfer · noop.

### Futures — account / USER_DATA (Phase 3)
balance · account · positionRisk · userTrades · income · leverageBracket · adlQuantile ·
forceOrders · commissionRate · order (query) · openOrder · openOrders · allOrders · MMP
(set/get/delete/reset). WS user-data: createListenKey · keepalive · close + ACCOUNT_UPDATE /
ORDER_TRADE_UPDATE / margin call / config update / TradePro events.

### Futures — account management (Phase 4, ⚠️ signing TBD)
registerAndApproveAgent · approveAgent · updateAgent · agent (del/get) · approveBuilder ·
updateBuilder · builder (del/get) · sub-account (bind/create/list/update/transfer) · asset
migrateUser (+history).

### Spot (Phase 5)
market: ping · time · exchangeInfo · depth · trades · historicalTrades · aggTrades · klines ·
ticker/24hr · ticker/price · ticker/bookTicker · commissionRate · noop.
trade: order · cancelOrder · queryOrder · openOrder · openOrders · cancelAllOpenOrders · allOrders
· perp-spot transfer · withdraw (+ fee).
account: account · userTrades. WS: streams + listenKey user-data.

## Conventions & invariants

- camelCase public API; array-shaped responses decoded to objects.
- decimal strings for amounts/prices; `AsterApiError {status, code, message}`.
- the **exact** serialized query string is both signed and transmitted (server reconstructs `msg`).
- reads: label optional (mainnet default); writes: label mandatory.
- testnet integration tests use the real `.env` accounts, run sequentially (`fileParallelism:false`).
