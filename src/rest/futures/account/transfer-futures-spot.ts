import type { AsterClient } from '../../../common/config';
import type { TransferParams, TransferResult } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Transfer an asset between the futures and spot wallets (`TRANSFER`). */
export function transferFuturesSpot(
  client: AsterClient,
  params: TransferParams,
  label: string,
): Promise<TransferResult> {
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
  return httpPostForm<TransferResult>(
    client,
    'futures',
    '/fapi/v3/asset/wallet/transfer',
    body,
    network,
  );
}
