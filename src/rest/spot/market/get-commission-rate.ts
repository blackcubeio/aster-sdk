import { httpGet } from '../../client';
import type { SpotCommissionRate } from '../types';

/** Maker/taker fees for a spot symbol. */
export function getCommissionRateSpot(symbol: string, label?: string): Promise<SpotCommissionRate> {
  return httpGet<SpotCommissionRate>('spot', '/api/v3/commissionRate', { symbol }, label);
}
