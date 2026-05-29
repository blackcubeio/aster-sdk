# Futures — Account reads (USER_DATA)

Signed read-only endpoints on the futures product. The `label` argument is **mandatory** (the
request is agent-signed) and selects the network.

🔑 = agent-signed `USER_DATA`.

| Function | Endpoint | Returns |
|---|---|---|
| 🔑 `getBalance(label)` | `GET /fapi/v3/balance` | `FuturesBalance[]` |
| 🔑 `getAccountInfo(label)` | `GET /fapi/v3/accountWithJoinMargin` | `AccountInfo` |
| 🔑 `getPositionRisk(symbol, label)` | `GET /fapi/v3/positionRisk` | `PositionRisk[]` |
| 🔑 `queryOrder(params, label)` | `GET /fapi/v3/order` | `OrderDetail` |
| 🔑 `getOpenOrder(params, label)` | `GET /fapi/v3/openOrder` | `OrderDetail` |
| 🔑 `getOpenOrders(symbol, label)` | `GET /fapi/v3/openOrders` | `OrderDetail[]` |
| 🔑 `getAllOrders(query, label)` | `GET /fapi/v3/allOrders` | `OrderDetail[]` |
| 🔑 `getUserTrades(query, label)` | `GET /fapi/v3/userTrades` | `UserTrade[]` |
| 🔑 `getIncome(query, label)` | `GET /fapi/v3/income` | `IncomeEntry[]` |
| 🔑 `getLeverageBracket(symbol, label)` | `GET /fapi/v3/leverageBracket` | `LeverageBracket` \| `LeverageBracket[]` |
| 🔑 `getAdlQuantile(symbol, label)` | `GET /fapi/v3/adlQuantile` | `AdlQuantile[]` |
| 🔑 `getForceOrders(query, label)` | `GET /fapi/v3/forceOrders` | `OrderDetail[]` |
| 🔑 `getCommissionRate(symbol, label)` | `GET /fapi/v3/commissionRate` | `CommissionRate` |
| 🔑 `getPositionMarginHistory(query, label)` | `GET /fapi/v3/positionMargin/history` | `PositionMarginHistoryEntry[]` |
| 🔑 `updateMmp(params, label)` | `POST /fapi/v3/mmp` | `boolean` |
| 🔑 `getMmp(symbol, label)` | `GET /fapi/v3/mmp` | `MmpConfig[]` |
| 🔑 `deleteMmp(symbol, label)` | `DELETE /fapi/v3/mmp` | `boolean` |
| 🔑 `resetMmp(symbol, label)` | `POST /fapi/v3/mmpReset` | `boolean` |

For the symbol-or-all endpoints pass `undefined` as the symbol to query every symbol:
`getPositionRisk(undefined, 'trader')`, `getOpenOrders(undefined, 'trader')`. `getLeverageBracket`
returns a single object when a symbol is given (overloaded), an array otherwise.

## Example

```ts
const account = await getAccountInfo('trader');
const positions = await getPositionRisk('BTCUSDT', 'trader');
const open = await getOpenOrders('BTCUSDT', 'trader');
```

MMP (market-maker protection) lets a market maker auto-freeze after hitting qty/value/delta limits
within a rolling window. `updateMmp`/`getMmp`/`deleteMmp`/`resetMmp` all return `boolean`/config.
