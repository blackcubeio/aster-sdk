import type { AsterClient } from '../common/config';
import type { FuturesOrder } from '../common/futures';
import type { EditOrderParams, EditOrderResult } from '../common/types';
import { httpPostForm } from './client';
import { buildOrderRef } from './futures/trade/payloads';
import { buildSignedRequest } from './signing';

/** Modifie le prix/quantité d'un ordre actif (**écriture signée**, Aster `/fapi/v3/order` PUT). */
export function editOrder(
  client: AsterClient,
  params: EditOrderParams,
  label: string,
): Promise<EditOrderResult> {
  const payload = buildOrderRef(
    params.name,
    params.id === undefined ? undefined : Number(params.id),
    params.clientId,
  );
  payload.quantity = params.size;
  payload.price = params.price;
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm<FuturesOrder>(client, 'futures', '/fapi/v3/order', body, network, 'PUT').then(
    (order) => ({
      name: params.name,
      id: String(order.orderId),
      xtras: { ...order },
    }),
  );
}
