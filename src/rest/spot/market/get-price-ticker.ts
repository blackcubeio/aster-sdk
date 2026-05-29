import { httpGet } from '../../client';
import type { SpotPriceTicker } from '../types';

/** Latest spot price for one symbol, or all symbols when omitted. */
export function getPriceTickerSpot(symbol: string, label?: string): Promise<SpotPriceTicker>;
export function getPriceTickerSpot(symbol?: undefined, label?: string): Promise<SpotPriceTicker[]>;
export function getPriceTickerSpot(
  symbol?: string,
  label?: string,
): Promise<SpotPriceTicker | SpotPriceTicker[]> {
  return httpGet<SpotPriceTicker | SpotPriceTicker[]>(
    'spot',
    '/api/v3/ticker/price',
    { symbol },
    label,
  );
}
