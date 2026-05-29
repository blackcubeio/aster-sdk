import { httpGet } from '../../client';
import type { SpotExchangeInfo } from '../types';

/** Spot trading rules and symbol information. */
export function getExchangeInfoSpot(label?: string): Promise<SpotExchangeInfo> {
  return httpGet<SpotExchangeInfo>('spot', '/api/v3/exchangeInfo', undefined, label);
}
