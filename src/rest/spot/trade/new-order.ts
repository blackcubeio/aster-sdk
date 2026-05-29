import { OrderType } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { SpotNewOrderParams, SpotOrder } from '../types';
import { buildSpotOrderPayload } from './payloads';

/** Place a spot order of any `type` (`TRADE`, signé par l'agent). */
export function createOrderSpot(params: SpotNewOrderParams, label: string): Promise<SpotOrder> {
  const { body, network } = buildSignedRequest(buildSpotOrderPayload(params), label);
  return httpPostForm<SpotOrder>('spot', '/api/v3/order', body, network);
}

/** Place a spot `LIMIT` order. */
export function createLimitOrderSpot(
  params: Omit<SpotNewOrderParams, 'type'>,
  label: string,
): Promise<SpotOrder> {
  return createOrderSpot({ ...params, type: OrderType.Limit }, label);
}

/** Place a spot `MARKET` order (`quantity` to sell base, `quoteOrderQty` to spend quote). */
export function createMarketOrderSpot(
  params: Omit<SpotNewOrderParams, 'type'>,
  label: string,
): Promise<SpotOrder> {
  return createOrderSpot({ ...params, type: OrderType.Market }, label);
}
