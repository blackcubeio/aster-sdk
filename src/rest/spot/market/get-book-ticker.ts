import type { AsterClient } from '../../../common/config';
import type { SpotBookTicker } from '../../../common/spot';
import { httpGet } from '../../client';

/** Best bid/ask for one symbol, or all symbols when omitted. */
export function getBookTickerSpot(
  client: AsterClient,
  symbol: string,
  label?: string,
): Promise<SpotBookTicker>;
export function getBookTickerSpot(
  client: AsterClient,
  symbol?: undefined,
  label?: string,
): Promise<SpotBookTicker[]>;
export function getBookTickerSpot(
  client: AsterClient,
  symbol?: string,
  label?: string,
): Promise<SpotBookTicker | SpotBookTicker[]> {
  return httpGet<SpotBookTicker | SpotBookTicker[]>(
    client,
    'spot',
    '/api/v3/ticker/bookTicker',
    { symbol },
    label,
  );
}
