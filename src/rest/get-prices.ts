import type { Price } from '../common/types';
import { httpGet } from './client';
import { PriceConverter, type PriceNative } from './converters/price';

interface BookTickerWire {
  symbol: string;
  bidPrice: string;
  askPrice: string;
}
interface PriceTickerWire {
  symbol: string;
  price: string;
}

/**
 * Prix de tous les marchés au **format unifié** `Price` (Aster). Fusionne `premiumIndex`
 * (mark/oracle/funding), `ticker/bookTicker` (bid/ask) et `ticker/price` (last).
 * `mid`/`openInterest`/`volume24h`/`prevDayPrice` non fournis (`null`).
 */
export function getPrices(label?: string): Promise<Price[]> {
  const converter = new PriceConverter();
  return Promise.all([
    httpGet<PriceNative[]>('futures', '/fapi/v3/premiumIndex', {}, label),
    httpGet<BookTickerWire[]>('futures', '/fapi/v3/ticker/bookTicker', {}, label),
    httpGet<PriceTickerWire[]>('futures', '/fapi/v3/ticker/price', {}, label),
  ]).then(([premium, books, lasts]) => {
    const bid = new Map(books.map((b) => [b.symbol, b.bidPrice] as const));
    const ask = new Map(books.map((b) => [b.symbol, b.askPrice] as const));
    const last = new Map(lasts.map((p) => [p.symbol, p.price] as const));
    return premium.map((entry) => {
      const price = converter.toCommon(entry);
      price.bid = bid.get(entry.symbol) ?? null;
      price.ask = ask.get(entry.symbol) ?? null;
      price.last = last.get(entry.symbol) ?? null;
      return price;
    });
  });
}
