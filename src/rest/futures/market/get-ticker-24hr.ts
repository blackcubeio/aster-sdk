import { httpGet } from '../../client';
import type { Ticker24hr } from '../types';

/** 24h rolling-window price change statistics for one symbol, or all when omitted. */
export function getTicker24hr(symbol: string, label?: string): Promise<Ticker24hr>;
export function getTicker24hr(symbol?: undefined, label?: string): Promise<Ticker24hr[]>;
export function getTicker24hr(symbol?: string, label?: string): Promise<Ticker24hr | Ticker24hr[]> {
  return httpGet<Ticker24hr | Ticker24hr[]>('futures', '/fapi/v3/ticker/24hr', { symbol }, label);
}
