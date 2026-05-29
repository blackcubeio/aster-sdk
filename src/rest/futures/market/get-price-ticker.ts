import { httpGet } from '../../client';
import type { PriceTicker } from '../types';

/** Latest price for one symbol, or all symbols when omitted. */
export function getPriceTicker(symbol: string, label?: string): Promise<PriceTicker>;
export function getPriceTicker(symbol?: undefined, label?: string): Promise<PriceTicker[]>;
export function getPriceTicker(
  symbol?: string,
  label?: string,
): Promise<PriceTicker | PriceTicker[]> {
  return httpGet<PriceTicker | PriceTicker[]>(
    'futures',
    '/fapi/v3/ticker/price',
    { symbol },
    label,
  );
}
