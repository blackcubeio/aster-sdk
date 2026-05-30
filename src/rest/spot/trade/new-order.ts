import type { AsterClient } from '../../../common/config';
import type { SpotNewOrderParams, SpotOrder } from '../../../common/spot';
import { OrderType } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildSpotOrderPayload } from './payloads';

/** Place a spot order of any `type` (`TRADE`, signé par l'agent). */
export function createOrderSpot(
  client: AsterClient,
  params: SpotNewOrderParams,
  label: string,
): Promise<SpotOrder> {
  const { body, network } = buildSignedRequest(client, buildSpotOrderPayload(params), label);
  return httpPostForm<SpotOrder>(client, 'spot', '/api/v3/order', body, network);
}

/** Place a spot `LIMIT` order. */
export function createLimitOrderSpot(
  client: AsterClient,
  params: Omit<SpotNewOrderParams, 'type'>,
  label: string,
): Promise<SpotOrder> {
  return createOrderSpot(client, { ...params, type: OrderType.Limit }, label);
}

/** Place a spot `MARKET` order (`quantity` to sell base, `quoteOrderQty` to spend quote). */
export function createMarketOrderSpot(
  client: AsterClient,
  params: Omit<SpotNewOrderParams, 'type'>,
  label: string,
): Promise<SpotOrder> {
  return createOrderSpot(client, { ...params, type: OrderType.Market }, label);
}
