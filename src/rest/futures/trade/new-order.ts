import type { AsterClient } from '../../../common/config';
import type { FuturesOrder, NewOrderParams } from '../../../common/futures';
import { OrderType } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildOrderPayload } from './payloads';

/**
 * Place a new futures order of any `type` (`TRADE`, signé par l'agent) — y compris les
 * types conditionnels (STOP, TAKE_PROFIT, TRAILING_STOP_MARKET…). Pour les cas courants,
 * voir {@link createLimitOrder} / {@link createMarketOrder}. Un `newClientOrderId` est
 * généré si absent.
 */
export function createOrder(
  client: AsterClient,
  params: NewOrderParams,
  label: string,
): Promise<FuturesOrder> {
  const { body, network } = buildSignedRequest(client, buildOrderPayload(params), label);
  return httpPostForm<FuturesOrder>(client, 'futures', '/fapi/v3/order', body, network);
}

/** Place a `LIMIT` order. Raccourci de {@link createOrder} avec `type: LIMIT`. */
export function createLimitOrder(
  client: AsterClient,
  params: Omit<NewOrderParams, 'type'>,
  label: string,
): Promise<FuturesOrder> {
  return createOrder(client, { ...params, type: OrderType.Limit }, label);
}

/** Place a `MARKET` order. Raccourci de {@link createOrder} avec `type: MARKET`. */
export function createMarketOrder(
  client: AsterClient,
  params: Omit<NewOrderParams, 'type'>,
  label: string,
): Promise<FuturesOrder> {
  return createOrder(client, { ...params, type: OrderType.Market }, label);
}
