import { httpGet } from '../../client';
import type { BookTicker } from '../types';

/** Best bid/ask on the order book for one symbol, or all symbols when omitted. */
export function getBookTicker(symbol: string, label?: string): Promise<BookTicker>;
export function getBookTicker(symbol?: undefined, label?: string): Promise<BookTicker[]>;
export function getBookTicker(symbol?: string, label?: string): Promise<BookTicker | BookTicker[]> {
  return httpGet<BookTicker | BookTicker[]>(
    'futures',
    '/fapi/v3/ticker/bookTicker',
    { symbol },
    label,
  );
}
