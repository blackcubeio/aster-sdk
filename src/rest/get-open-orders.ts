import type { GetOpenOrdersParams } from '../common/types';
import type { MarketKind, Order } from '../common/types';
import { OrderConverter, type OrderNative } from '../converters/order';
import { httpGetSigned } from './client';
import { buildSignedRequest } from './signing';

/**
 * Ordres ouverts au **format unifié** `Order` (Aster futures `/fapi/v3/openOrders`, **signé**).
 * Le routage spot sera ajouté ensuite (shape `SpotOrder` distincte).
 */
export function getOpenOrders(params: GetOpenOrdersParams, label: string): Promise<Order[]> {
  const converter = new OrderConverter();
  const { body, network } = buildSignedRequest({ symbol: params.name }, label);
  return httpGetSigned<OrderNative[]>('futures', '/fapi/v3/openOrders', body, network).then(
    (wire) => wire.map((entry) => converter.toCommon(entry)),
  );
}
