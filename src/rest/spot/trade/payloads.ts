import type { JsonObject } from '../../../common/types';
import { newClientOrderId } from '../../signing';
import type { SpotNewOrderParams } from '../types';

/** Construit la charge d'un ordre spot (partagée par createOrderSpot et ses raccourcis). */
export function buildSpotOrderPayload(params: SpotNewOrderParams): JsonObject {
  const payload: JsonObject = {
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    newClientOrderId: params.newClientOrderId ?? newClientOrderId(),
  };
  if (params.timeInForce !== undefined) {
    payload.timeInForce = params.timeInForce;
  }
  if (params.quantity !== undefined) {
    payload.quantity = params.quantity;
  }
  if (params.quoteOrderQty !== undefined) {
    payload.quoteOrderQty = params.quoteOrderQty;
  }
  if (params.price !== undefined) {
    payload.price = params.price;
  }
  if (params.stopPrice !== undefined) {
    payload.stopPrice = params.stopPrice;
  }
  return payload;
}

/** Référence un ordre spot par `orderId` (prioritaire) ou `origClientOrderId`. */
export function buildSpotOrderRef(
  symbol: string,
  orderId?: number,
  origClientOrderId?: string,
): JsonObject {
  const payload: JsonObject = { symbol };
  if (orderId !== undefined) {
    payload.orderId = orderId;
  } else if (origClientOrderId !== undefined) {
    payload.origClientOrderId = origClientOrderId;
  } else {
    throw new Error('orderId ou origClientOrderId est requis');
  }
  return payload;
}
