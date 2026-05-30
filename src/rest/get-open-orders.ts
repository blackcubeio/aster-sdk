import type { AsterClient } from '../common/config';
import type { SpotOrder } from '../common/spot';
import type { GetOpenOrdersParams } from '../common/types';
import type { Order } from '../common/types';
import { OrderConverter, type OrderNative, SpotOrderConverter } from '../converters/order';
import { httpGetSigned } from './client';
import { buildSignedRequest } from './signing';

/**
 * Ordres ouverts au **format unifié** `Order`. `kind` route futures (`/fapi/v3/openOrders`) ou
 * spot (`/api/v3/openOrders`) — les deux signés ; chaque produit a son convertisseur dédié.
 */
export function getOpenOrders(
  client: AsterClient,
  params: GetOpenOrdersParams,
  label: string,
): Promise<Order[]> {
  if ((params.kind ?? 'perp') === 'spot') {
    const converter = new SpotOrderConverter();
    const { body, network } = buildSignedRequest(client, { symbol: params.name }, label);
    return httpGetSigned<SpotOrder[]>(client, 'spot', '/api/v3/openOrders', body, network).then(
      (wire) => wire.map((entry) => converter.toCommon(entry)),
    );
  }
  const converter = new OrderConverter();
  const { body, network } = buildSignedRequest(client, { symbol: params.name }, label);
  return httpGetSigned<OrderNative[]>(client, 'futures', '/fapi/v3/openOrders', body, network).then(
    (wire) => wire.map((entry) => converter.toCommon(entry)),
  );
}
