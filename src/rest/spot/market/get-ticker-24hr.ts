import type { SpotTicker24hr } from '../../../common/spot';
import { httpGet } from '../../client';

/** 24h spot ticker for one symbol, or all symbols when omitted. */
export function getTicker24hrSpot(symbol: string, label?: string): Promise<SpotTicker24hr>;
export function getTicker24hrSpot(symbol?: undefined, label?: string): Promise<SpotTicker24hr[]>;
export function getTicker24hrSpot(
  symbol?: string,
  label?: string,
): Promise<SpotTicker24hr | SpotTicker24hr[]> {
  return httpGet<SpotTicker24hr | SpotTicker24hr[]>(
    'spot',
    '/api/v3/ticker/24hr',
    { symbol },
    label,
  );
}
