import type { GetOrderHistoryParams } from '../common/types';
import type { Order } from '../common/types';
import { OrderConverter, type OrderNative } from '../converters/order';
import { httpGetSigned } from './client';
import { buildSignedRequest } from './signing';

/**
 * Historique d'ordres (actifs/annulés/exécutés) au **format unifié** `Order`
 * (Aster `/fapi/v3/allOrders`, **signé**). Le statut vient du natif (pas forcé à `open`).
 */
export function getOrderHistory(params: GetOrderHistoryParams, label: string): Promise<Order[]> {
  const converter = new OrderConverter();
  const { body, network } = buildSignedRequest(
    {
      symbol: params.name,
      startTime: params.startTime,
      endTime: params.endTime,
      limit: params.limit,
    },
    label,
  );
  return httpGetSigned<OrderNative[]>('futures', '/fapi/v3/allOrders', body, network).then((wire) =>
    wire.map((entry) => converter.toCommon(entry)),
  );
}
