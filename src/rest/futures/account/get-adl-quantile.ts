import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { AdlQuantile } from '../types';

/** Position ADL quantile estimation, optionally filtered by symbol (`USER_DATA`). */
export function getAdlQuantile(symbol: string | undefined, label: string): Promise<AdlQuantile[]> {
  const { body, network } = buildSignedRequest({ symbol }, label);
  return httpGetSigned<AdlQuantile[]>('futures', '/fapi/v3/adlQuantile', body, network);
}
