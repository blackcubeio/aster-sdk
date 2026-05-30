import type { SpotBookTicker } from '../../../common/spot';
import { httpGet } from '../../client';

/** Best bid/ask for one symbol, or all symbols when omitted. */
export function getBookTickerSpot(symbol: string, label?: string): Promise<SpotBookTicker>;
export function getBookTickerSpot(symbol?: undefined, label?: string): Promise<SpotBookTicker[]>;
export function getBookTickerSpot(
  symbol?: string,
  label?: string,
): Promise<SpotBookTicker | SpotBookTicker[]> {
  return httpGet<SpotBookTicker | SpotBookTicker[]>(
    'spot',
    '/api/v3/ticker/bookTicker',
    { symbol },
    label,
  );
}
