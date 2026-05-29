import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { SpotTransferParams, SpotTransferResult } from '../types';

/** Transfer an asset between spot and perp wallets (`TRADE`). */
export function transferSpot(
  params: SpotTransferParams,
  label: string,
): Promise<SpotTransferResult> {
  const { body, network } = buildSignedRequest(
    {
      asset: params.asset,
      amount: params.amount,
      clientTranId: params.clientTranId,
      kindType: params.kindType,
    },
    label,
  );
  return httpPostForm<SpotTransferResult>('spot', '/api/v3/asset/wallet/transfer', body, network);
}
