# Futures — Trading & config (signed)

Signed actions on the futures product (`/fapi/v3/*`), signed by the **agent** (API wallet) key.
The `label` argument is **mandatory** and selects both the signing wallet and the network.

🔑 = agent-signed (TRADE / USER_DATA).

## Orders

| Function | Endpoint | Returns |
|---|---|---|
| 🔑 `createOrder(params, label)` | `POST /fapi/v3/order` | `Order` |
| 🔑 `modifyOrder(params, label)` | `PUT /fapi/v3/order` | `Order` |
| 🔑 `cancelOrder(params, label)` | `DELETE /fapi/v3/order` | `Order` |
| 🔑 `cancelAllOpenOrders(symbol, label)` | `DELETE /fapi/v3/allOpenOrders` | `CodeMsg` |
| 🔑 `cancelMultipleOrders(params, label)` | `DELETE /fapi/v3/batchOrders` | `BatchOrderResult[]` |
| 🔑 `batchOrders(orders, label)` | `POST /fapi/v3/batchOrders` | `BatchOrderResult[]` |
| 🔑 `countdownCancelAll(params, label)` | `POST /fapi/v3/countdownCancelAll` | `CountdownCancelAllResult` |
| 🔑 `chaseOrder(params, label)` | `POST /fapi/v3/chase` | `ChaseOrder` |

- `createOrder` / `batchOrders` generate a `newClientOrderId` when omitted. Batch is max 5 orders;
  each result entry is either an `Order` or a per-item `{ code, msg }`.
- `modifyOrder` and `cancelOrder` reference the order by `orderId` (preferred) or
  `origClientOrderId`.
- `cancelMultipleOrders` takes `orderIdList` **or** `origClientOrderIdList` (max 10), JSON-encoded
  on the wire.
- `countdownCancelAll` is a dead-man's switch: re-arm it as a heartbeat; `countdownTime: 0` disarms.

## Account configuration

| Function | Endpoint | Returns |
|---|---|---|
| 🔑 `setPositionMode(dualSidePosition, label)` | `POST /fapi/v3/positionSide/dual` | `CodeMsg` |
| 🔑 `getPositionMode(label)` | `GET /fapi/v3/positionSide/dual` | `PositionModeResult` |
| 🔑 `setStpMode(stpMode, label)` | `POST /fapi/v3/stpMode` | `CodeMsg` |
| 🔑 `getStpMode(label)` | `GET /fapi/v3/stpMode` | `StpModeResult` |
| 🔑 `setMultiAssetsMode(multiAssetsMargin, label)` | `POST /fapi/v3/multiAssetsMargin` | `CodeMsg` |
| 🔑 `getMultiAssetsMode(label)` | `GET /fapi/v3/multiAssetsMargin` | `MultiAssetsModeResult` |
| 🔑 `setLeverage(params, label)` | `POST /fapi/v3/leverage` | `LeverageResult` |
| 🔑 `setMarginType(params, label)` | `POST /fapi/v3/marginType` | `CodeMsg` |
| 🔑 `modifyIsolatedMargin(params, label)` | `POST /fapi/v3/positionMargin` | `ModifyIsolatedMarginResult` |

## Funds

| Function | Endpoint | Returns |
|---|---|---|
| 🔑 `transferFuturesSpot(params, label)` | `POST /fapi/v3/asset/wallet/transfer` | `TransferResult` |
| 🔑 `getBalance(label)` | `GET /fapi/v3/balance` | `FuturesBalance[]` |

## Example

```ts
import { init, createOrder, cancelOrder, OrderSide, OrderType, TimeInForce } from '@blackcube/aster-sdk';

init({ signers: { trader: { privateKey, user, network: 'mainnet' } } });

const order = await createOrder(
  { symbol: 'BTCUSDT', side: OrderSide.Buy, type: OrderType.Limit, timeInForce: TimeInForce.Gtc,
    quantity: '0.01', price: '50000' },
  'trader',
);
await cancelOrder({ symbol: 'BTCUSDT', orderId: order.orderId }, 'trader');
```

> Booleans (`reduceOnly`, `closePosition`, `dualSidePosition`, `multiAssetsMargin`…) are sent as
> the strings `"true"` / `"false"`, which is what Aster expects.
