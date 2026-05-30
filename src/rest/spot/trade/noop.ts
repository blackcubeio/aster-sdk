import type { AsterClient } from '../../../common/config';
import type { CodeMsg } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** No-op signé (`TRADE`) : annule une transaction spot encore en file (même nonce ciblé). */
export function noopSpot(client: AsterClient, label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<CodeMsg>(client, 'spot', '/api/v3/noop', body, network);
}
