import type { AsterClient } from '../../../common/config';
import type { CodeMsg, MultiAssetsModeResult } from '../../../common/futures';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Set multi-assets margin mode for every symbol (`TRADE`). */
export function updateMultiAssetsMode(
  client: AsterClient,
  multiAssetsMargin: boolean,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest(client, { multiAssetsMargin }, label);
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/multiAssetsMargin', body, network);
}

/** Get current multi-assets margin mode (`USER_DATA`). */
export function getMultiAssetsMode(
  client: AsterClient,
  label: string,
): Promise<MultiAssetsModeResult> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<MultiAssetsModeResult>(
    client,
    'futures',
    '/fapi/v3/multiAssetsMargin',
    body,
    network,
  );
}
