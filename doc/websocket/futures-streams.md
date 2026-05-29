# Futures — WebSocket market streams

Real-time market data on `fstream.asterdex.com` (testnet `fstream.asterdex-testnet.com`). The
client connects in **combined** mode (`/stream`) and dispatches each message to the handlers
registered for its stream name. Payloads are delivered **raw** (`JsonValue`), exactly as Aster
emits them. Symbols are lowercased automatically.

```ts
import { init, FuturesWsClient, KlineInterval } from '@blackcube/aster-sdk';

init();
const ws = new FuturesWsClient();              // or new FuturesWsClient({ label: 'tester' })
await ws.connect();

const off = ws.subscribeKline('BTCUSDT', KlineInterval.OneMinute, (data) => console.log(data));
ws.subscribeBookTicker('BTCUSDT', (data) => console.log(data));

// later
off();                                         // unsubscribe one handler
ws.disconnect();
```

## Streams

| Method | Stream name |
|---|---|
| `subscribeAggTrade(symbol, h)` | `<symbol>@aggTrade` |
| `subscribeMarkPrice(symbol, h, fast?)` | `<symbol>@markPrice` / `@markPrice@1s` |
| `subscribeAllMarkPrices(h, fast?)` | `!markPrice@arr` / `!markPrice@arr@1s` |
| `subscribeKline(symbol, interval, h)` | `<symbol>@kline_<interval>` |
| `subscribeMiniTicker(symbol, h)` | `<symbol>@miniTicker` |
| `subscribeAllMiniTickers(h)` | `!miniTicker@arr` |
| `subscribeTicker(symbol, h)` | `<symbol>@ticker` |
| `subscribeAllTickers(h)` | `!ticker@arr` |
| `subscribeBookTicker(symbol, h)` | `<symbol>@bookTicker` |
| `subscribeAllBookTickers(h)` | `!bookTicker` |
| `subscribeForceOrder(symbol, h)` | `<symbol>@forceOrder` |
| `subscribeAllForceOrders(h)` | `!forceOrder@arr` |
| `subscribePartialDepth(symbol, levels, h, speed?)` | `<symbol>@depth<5\|10\|20>[@100ms\|@500ms]` |
| `subscribeDiffDepth(symbol, h, speed?)` | `<symbol>@depth[@100ms\|@500ms]` |

Each `subscribe*` returns an `Unsubscribe` function. The client tracks active stream names and
**re-subscribes automatically** after a reconnect (`onReconnect` hook). Connection-level ping/pong
is handled by the underlying WebSocket; no application heartbeat is needed.

## Hooks

`onMessage` (every raw frame), `onError`, `onClose`, `onReconnect`.

## Limits (per Aster)

A connection lives at most 24h, accepts ≤ 10 incoming messages/s, and ≤ 200 streams. User-data
streams (account/order updates over `listenKey`) are part of the trading roadmap — see
[PLAN.md](../PLAN.md).
