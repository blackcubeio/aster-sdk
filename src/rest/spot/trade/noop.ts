import { httpPostForm } from '../../client';
import type { CodeMsg } from '../../futures/types';
import { buildSignedRequest } from '../../signing';

/** No-op signé (`TRADE`) : annule une transaction spot encore en file (même nonce ciblé). */
export function noopSpot(label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest({}, label);
  return httpPostForm<CodeMsg>('spot', '/api/v3/noop', body, network);
}
