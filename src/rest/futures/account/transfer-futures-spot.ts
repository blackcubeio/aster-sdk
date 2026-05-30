import type { TransferParams, TransferResult } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Transfer an asset between the futures and spot wallets (`TRANSFER`). */
export function transferFuturesSpot(
  params: TransferParams,
  label: string,
): Promise<TransferResult> {
  const { body, network } = buildSignedRequest(
    {
      asset: params.asset,
      amount: params.amount,
      clientTranId: params.clientTranId,
      kindType: params.kindType,
    },
    label,
  );
  return httpPostForm<TransferResult>('futures', '/fapi/v3/asset/wallet/transfer', body, network);
}
