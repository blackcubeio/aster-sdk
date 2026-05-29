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

## User-data stream

Account/order push lives on a separate raw connection bound to a `listenKey` (REST
`createListenKey` / `keepAliveListenKey` / `closeListenKey`, all agent-signed). `FuturesUserDataStream`
connects to `/ws/<listenKey>` and dispatches each event by its `e` type.

```ts
import { init, createListenKey, FuturesUserDataStream } from '@blackcube/aster-sdk';

init({ signers: { trader: { privateKey, user, network: 'mainnet' } } });
const { listenKey } = await createListenKey('trader');

const stream = new FuturesUserDataStream(listenKey, { label: 'trader' });
await stream.connect();
stream.on('ORDER_TRADE_UPDATE', (e) => console.log(e));
stream.on('ACCOUNT_UPDATE', (e) => console.log(e));
stream.on('listenKeyExpired', () => { /* refresh the listenKey */ });
```

Refresh the `listenKey` (`keepAliveListenKey`) roughly every 60 min; the key expires otherwise.

## Limits (per Aster)

A connection lives at most 24h, accepts ≤ 10 incoming messages/s, and ≤ 200 streams.
