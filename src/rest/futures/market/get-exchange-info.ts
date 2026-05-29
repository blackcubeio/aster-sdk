import { httpGet } from '../../client';
import type { ExchangeInfo } from '../types';

/** Current exchange trading rules and symbol information. */
export function getExchangeInfo(label?: string): Promise<ExchangeInfo> {
  return httpGet<ExchangeInfo>('futures', '/fapi/v3/exchangeInfo', undefined, label);
}
