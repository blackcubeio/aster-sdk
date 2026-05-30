import type { CancelAllOrdersParams, CancelAllResult } from '../common/types';
import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { buildSignedRequest } from './signing';

/** Annule tous les ordres ouverts d'une paire (**écriture signée**, Aster `/fapi/v3/allOpenOrders`). */
export function cancelAllOrders(
  params: CancelAllOrdersParams,
  label: string,
): Promise<CancelAllResult> {
  const { body, network } = buildSignedRequest({ symbol: params.name }, label);
  return httpPostForm('futures', '/fapi/v3/allOpenOrders', body, network, 'DELETE').then(() => ({
    cancelled: null,
  }));
}
