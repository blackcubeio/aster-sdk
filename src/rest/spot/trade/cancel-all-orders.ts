import type { JsonObject } from '../../../common/types';
import { httpPostForm } from '../../client';
import type { CodeMsg } from '../../futures/types';
import { buildSignedRequest } from '../../signing';
import type { SpotCancelAllParams } from '../types';

/**
 * Cancel all open spot orders on a symbol (`TRADE`). Optionnellement restreint à des listes
 * d'IDs (`orderIdList` / `origClientOrderIdList`, chaînes de tableau JSON).
 */
export function cancelAllOrdersSpot(params: SpotCancelAllParams, label: string): Promise<CodeMsg> {
  const payload: JsonObject = { symbol: params.symbol };
  if (params.orderIdList !== undefined) {
    payload.orderIdList = params.orderIdList;
  }
  if (params.origClientOrderIdList !== undefined) {
    payload.origClientOrderIdList = params.origClientOrderIdList;
  }
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<CodeMsg>('spot', '/api/v3/allOpenOrders', body, network, 'DELETE');
}
