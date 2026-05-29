# Spot (`/api/v3/*`)

Spot product on `sapi.asterdex.com` (testnet `sapi.asterdex-testnet.com`). Same agent signing as
futures (`Message{msg}`, `user` included). **Spot functions carry a `Spot` suffix** to avoid
clashing with the futures names (`createOrderSpot`, `pingSpot`, …); types are `Spot…`-prefixed.

🔓 = public · 🔑 = agent-signed · 👤 = master-account-signed (EVM).

## Market data

| Function | Endpoint | Returns |
|---|---|---|
| 🔓 `pingSpot(label?)` | `GET /api/v3/ping` | `void` |
| 🔓 `getServerTimeSpot(label?)` | `GET /api/v3/time` | `SpotServerTime` |
| 🔓 `getExchangeInfoSpot(label?)` | `GET /api/v3/exchangeInfo` | `SpotExchangeInfo` |
| 🔓 `getOrderBookSpot(query, label?)` | `GET /api/v3/depth` | `SpotOrderBook` |
| 🔓 `getRecentTradesSpot(query, label?)` | `GET /api/v3/trades` | `SpotTrade[]` |
| 🔓 `getHistoricalTradesSpot(query, label?)` | `GET /api/v3/historicalTrades` | `SpotTrade[]` |
| 🔓 `getAggTradesSpot(query, label?)` | `GET /api/v3/aggTrades` | `SpotAggTrade[]` |
| 🔓 `getKlinesSpot(query, label?)` | `GET /api/v3/klines` | `SpotKline[]` |
| 🔓 `getTicker24hrSpot(symbol?, label?)` | `GET /api/v3/ticker/24hr` | `SpotTicker24hr` \| `[]` |
| 🔓 `getPriceTickerSpot(symbol?, label?)` | `GET /api/v3/ticker/price` | `SpotPriceTicker` \| `[]` |
| 🔓 `getBookTickerSpot(symbol?, label?)` | `GET /api/v3/ticker/bookTicker` | `SpotBookTicker` \| `[]` |
| 🔓 `getCommissionRateSpot(symbol, label?)` | `GET /api/v3/commissionRate` | `SpotCommissionRate` |

## Trading

| Function | Endpoint | Returns |
|---|---|---|
| 🔑 `createOrderSpot(params, label)` | `POST /api/v3/order` | `SpotOrder` |
| 🔑 `createLimitOrderSpot(params, label)` | `POST /api/v3/order` | `SpotOrder` |
| 🔑 `createMarketOrderSpot(params, label)` | `POST /api/v3/order` | `SpotOrder` |
| 🔑 `cancelOrderSpot(params, label)` | `DELETE /api/v3/order` | `SpotOrder` |
| 🔑 `cancelAllOrdersSpot(params, label)` | `DELETE /api/v3/allOpenOrders` | `CodeMsg` |
| 🔑 `noopSpot(label)` | `POST /api/v3/noop` | `CodeMsg` |
| 🔑 `transferSpot(params, label)` | `POST /api/v3/asset/wallet/transfer` | `SpotTransferResult` |

A `MARKET BUY` controls spend via `quoteOrderQty`; a `MARKET SELL` controls base via `quantity`.

## Account (reads)

| Function | Endpoint | Returns |
|---|---|---|
| 🔑 `queryOrderSpot(query, label)` | `GET /api/v3/order` | `SpotOrder` |
| 🔑 `getOpenOrderSpot(query, label)` | `GET /api/v3/openOrder` | `SpotOrder` |
| 🔑 `getOpenOrdersSpot(symbol, label)` | `GET /api/v3/openOrders` | `SpotOrder[]` |
| 🔑 `getAllOrdersSpot(query, label)` | `GET /api/v3/allOrders` | `SpotOrder[]` |
| 🔑 `getAccountInfoSpot(label)` | `GET /api/v3/account` | `SpotAccountInfo` |
| 🔑 `getUserTradesSpot(query, label)` | `GET /api/v3/userTrades` | `SpotUserTrade[]` |
| 🔑 `getTransactionHistorySpot(query, label)` | `GET /api/v3/transactionHistory` | `SpotTransactionEntry[]` |

## Withdraw (EVM-signed)

| Function | Endpoint | Returns |
|---|---|---|
| 🔓 `getWithdrawFeeSpot(query, label?)` | `GET /api/v3/aster/withdraw/estimateFee` | `WithdrawFee` |
| 👤 `withdrawSpot(params, label)` | `POST /api/v3/aster/user-withdraw` | `WithdrawResult` |

`withdrawSpot` is a **big operation**: signed by the master wallet (`mainPrivateKey`) via a distinct
EIP-712 (`domain.name = 'Aster'`, type `Action`, `chainId 56`) — not the `Message{msg}` envelope.
`receiver` defaults to the signer's `user`; `chainId` is the destination (1 ETH / 56 BSC / 42161
Arbitrum).
