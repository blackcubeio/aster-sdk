# Spot — WebSocket streams

Real-time spot data on `sstream.asterdex.com` (testnet `sstream.asterdex-testnet.com`).
`SpotWsClient` connects in **combined** mode (`/stream`) and dispatches each message to the
handlers registered for its stream name; payloads are raw `JsonValue`. Symbols are lowercased.

```ts
import { init, SpotWsClient, KlineInterval } from '@blackcube/aster-sdk';

init();
const ws = new SpotWsClient();              // or new SpotWsClient({ label: 'tester' })
await ws.connect();
const off = ws.subscribeTrade('ASTERUSDT', (d) => console.log(d));
ws.subscribeKline('ASTERUSDT', KlineInterval.OneMinute, (d) => console.log(d));
off();
ws.disconnect();
```

## Streams

| Method | Stream name |
|---|---|
| `subscribeAggTrade(symbol, h)` | `<symbol>@aggTrade` |
| `subscribeTrade(symbol, h)` | `<symbol>@trade` |
| `subscribeKline(symbol, interval, h)` | `<symbol>@kline_<interval>` |
| `subscribeMiniTicker(symbol, h)` / `subscribeAllMiniTickers(h)` | `<symbol>@miniTicker` / `!miniTicker@arr` |
| `subscribeTicker(symbol, h)` / `subscribeAllTickers(h)` | `<symbol>@ticker` / `!ticker@arr` |
| `subscribeBookTicker(symbol, h)` / `subscribeAllBookTickers(h)` | `<symbol>@bookTicker` / `!bookTicker` |
| `subscribePartialDepth(symbol, levels, h, fast?)` | `<symbol>@depth<5\|10\|20>[@100ms]` |
| `subscribeDiffDepth(symbol, h, fast?)` | `<symbol>@depth[@100ms]` |

## User-data stream

Account/order push over a `listenKey`: REST `createListenKeySpot` / `keepAliveListenKeySpot` /
`closeListenKeySpot` (agent-signed), then `SpotUserDataStream` connects to `/ws/<listenKey>` and
dispatches by event type `e` (`ACCOUNT_UPDATE`, order updates…). Refresh the key ~every 60 min.

```ts
const { listenKey } = await createListenKeySpot('trader');
const stream = new SpotUserDataStream(listenKey, { label: 'trader' });
await stream.connect();
stream.on('ACCOUNT_UPDATE', (e) => console.log(e));
```
