import { httpGet } from '../../client';
import type { IndexPriceReferences } from '../types';

/** Component exchanges and weights behind a symbol's index price. */
export function getIndexPriceReferences(
  symbol: string,
  label?: string,
): Promise<IndexPriceReferences> {
  return httpGet<IndexPriceReferences>('futures', '/fapi/v3/indexreferences', { symbol }, label);
}
