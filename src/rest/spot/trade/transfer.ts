import type { AsterClient } from '../../../common/config';
import type { SpotTransferParams, SpotTransferResult } from '../../../common/spot';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Transfer an asset between spot and perp wallets (`TRADE`). */
export function transferSpot(
  client: AsterClient,
  params: SpotTransferParams,
  label: string,
): Promise<SpotTransferResult> {
  const { body, network } = buildSignedRequest(
    client,
    {
      asset: params.asset,
      amount: params.amount,
      clientTranId: params.clientTranId,
      kindType: params.kindType,
    },
    label,
  );
  return httpPostForm<SpotTransferResult>(
    client,
    'spot',
    '/api/v3/asset/wallet/transfer',
    body,
    network,
  );
}
