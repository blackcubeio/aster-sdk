import type { AsterClient } from '../../../common/config';
import type { CodeMsg } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/**
 * No-op signé (`TRADE`) : annule efficacement une transaction encore en file et non
 * confirmée on-chain. Pour viser un ordre précis, son `nonce` doit être identique à celui
 * de l'ordre (sans garantie de succès).
 */
export function noop(client: AsterClient, label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/noop', body, network);
}
