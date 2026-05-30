import type { AsterClient } from '../../../common/config';
import type { IndexPriceReferences } from '../../../common/futures';
import { httpGet } from '../../client';

/** Component exchanges and weights behind a symbol's index price. */
export function getIndexPriceReferences(
  client: AsterClient,
  symbol: string,
  label?: string,
): Promise<IndexPriceReferences> {
  return httpGet<IndexPriceReferences>(
    client,
    'futures',
    '/fapi/v3/indexreferences',
    { symbol },
    label,
  );
}
