import type { AsterClient } from '../common/config';
import type { CancelOrderParams } from '../common/types';
import { httpPostForm } from './client';
import { buildOrderRef } from './futures/trade/payloads';
import { buildSignedRequest } from './signing';

/** Annule un ordre actif (**écriture signée**, Aster futures `/fapi/v3/order` DELETE). */
export function cancelOrder(
  client: AsterClient,
  params: CancelOrderParams,
  label: string,
): Promise<void> {
  const payload = buildOrderRef(
    params.name,
    params.id === undefined ? undefined : Number(params.id),
    params.clientId,
  );
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm(client, 'futures', '/fapi/v3/order', body, network, 'DELETE').then(
    () => undefined,
  );
}
