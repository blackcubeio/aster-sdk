import { httpGet } from '../../client';
import type { MarkPrice } from '../types';

/** Mark price and funding rate for one symbol, or for every symbol when omitted. */
export function getMarkPrice(symbol: string, label?: string): Promise<MarkPrice>;
export function getMarkPrice(symbol?: undefined, label?: string): Promise<MarkPrice[]>;
export function getMarkPrice(symbol?: string, label?: string): Promise<MarkPrice | MarkPrice[]> {
  return httpGet<MarkPrice | MarkPrice[]>('futures', '/fapi/v3/premiumIndex', { symbol }, label);
}
