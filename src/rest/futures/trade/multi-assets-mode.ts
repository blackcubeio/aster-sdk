import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { CodeMsg, MultiAssetsModeResult } from '../types';

/** Set multi-assets margin mode for every symbol (`TRADE`). */
export function setMultiAssetsMode(multiAssetsMargin: boolean, label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest({ multiAssetsMargin }, label);
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/multiAssetsMargin', body, network);
}

/** Get current multi-assets margin mode (`USER_DATA`). */
export function getMultiAssetsMode(label: string): Promise<MultiAssetsModeResult> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<MultiAssetsModeResult>(
    'futures',
    '/fapi/v3/multiAssetsMargin',
    body,
    network,
  );
}
