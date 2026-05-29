import { OrderType } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { NewOrderParams, Order } from '../types';
import { buildOrderPayload } from './payloads';

/**
 * Place a new futures order of any `type` (`TRADE`, signé par l'agent) — y compris les
 * types conditionnels (STOP, TAKE_PROFIT, TRAILING_STOP_MARKET…). Pour les cas courants,
 * voir {@link createLimitOrder} / {@link createMarketOrder}. Un `newClientOrderId` est
 * généré si absent.
 */
export function createOrder(params: NewOrderParams, label: string): Promise<Order> {
  const { body, network } = buildSignedRequest(buildOrderPayload(params), label);
  return httpPostForm<Order>('futures', '/fapi/v3/order', body, network);
}

/** Place a `LIMIT` order. Raccourci de {@link createOrder} avec `type: LIMIT`. */
export function createLimitOrder(
  params: Omit<NewOrderParams, 'type'>,
  label: string,
): Promise<Order> {
  return createOrder({ ...params, type: OrderType.Limit }, label);
}

/** Place a `MARKET` order. Raccourci de {@link createOrder} avec `type: MARKET`. */
export function createMarketOrder(
  params: Omit<NewOrderParams, 'type'>,
  label: string,
): Promise<Order> {
  return createOrder({ ...params, type: OrderType.Market }, label);
}
