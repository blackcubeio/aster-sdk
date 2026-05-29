# Futures — Market data

Public reads on the futures product (`fapi.asterdex.com`, paths under `/fapi/v3/*`). No signature
required. Every function takes an optional signer `label` as last argument to pick the network
(default mainnet).

🔓 = public.

| Function | Endpoint | Returns |
|---|---|---|
| 🔓 `ping(label?)` | `GET /fapi/v3/ping` | `void` |
| 🔓 `getServerTime(label?)` | `GET /fapi/v3/time` | `ServerTime` |
| 🔓 `getExchangeInfo(label?)` | `GET /fapi/v3/exchangeInfo` | `ExchangeInfo` |
| 🔓 `getOrderBook(query, label?)` | `GET /fapi/v3/depth` | `OrderBook` |
| 🔓 `getRecentTrades(query, label?)` | `GET /fapi/v3/trades` | `Trade[]` |
| 🔓 `getHistoricalTrades(query, label?)` | `GET /fapi/v3/historicalTrades` | `Trade[]` |
| 🔓 `getAggTrades(query, label?)` | `GET /fapi/v3/aggTrades` | `AggTrade[]` |
| 🔓 `getKlines(query, label?)` | `GET /fapi/v3/klines` | `Kline[]` |
| 🔓 `getIndexPriceKlines(query, label?)` | `GET /fapi/v3/indexPriceKlines` | `Kline[]` |
| 🔓 `getMarkPriceKlines(query, label?)` | `GET /fapi/v3/markPriceKlines` | `Kline[]` |
| 🔓 `getMarkPrice(symbol?, label?)` | `GET /fapi/v3/premiumIndex` | `MarkPrice` \| `MarkPrice[]` |
| 🔓 `getFundingRateHistory(query?, label?)` | `GET /fapi/v3/fundingRate` | `FundingRateEntry[]` |
| 🔓 `getFundingInfo(symbol?, label?)` | `GET /fapi/v3/fundingInfo` | `FundingInfo[]` |
| 🔓 `getTicker24hr(symbol?, label?)` | `GET /fapi/v3/ticker/24hr` | `Ticker24hr` \| `Ticker24hr[]` |
| 🔓 `getPriceTicker(symbol?, label?)` | `GET /fapi/v3/ticker/price` | `PriceTicker` \| `PriceTicker[]` |
| 🔓 `getBookTicker(symbol?, label?)` | `GET /fapi/v3/ticker/bookTicker` | `BookTicker` \| `BookTicker[]` |
| 🔓 `getIndexPriceReferences(symbol, label?)` | `GET /fapi/v3/indexreferences` | `IndexPriceReferences` |

The single-symbol endpoints (`getMarkPrice`, `getTicker24hr`, `getPriceTicker`, `getBookTicker`)
return a single object when a `symbol` is given and an array when omitted — typed via overloads.

## Example

```ts
import { init, getKlines, getMarkPrice, KlineInterval } from '@blackcube/aster-sdk';

init();

const candles = await getKlines({ symbol: 'BTCUSDT', interval: KlineInterval.OneHour, limit: 100 });
const mark = await getMarkPrice('BTCUSDT');     // single MarkPrice
const all = await getMarkPrice();               // MarkPrice[]
```

## Notes

- `getOrderBook` decodes Aster's `[price, qty]` tuples into `PriceLevel { price, qty }`, and exposes
  `eventTime` (`E`) and `transactionTime` (`T`).
- Klines (all three variants) are decoded from positional arrays into `Kline` objects; the index/
  mark variants leave the volume-related fields at `"0"` per the API.
- `getAggTrades` maps the short keys (`a/p/q/f/l/T/m`) to readable names.
