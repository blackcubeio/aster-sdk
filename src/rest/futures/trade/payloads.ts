import type { NewOrderParams } from '../../../common/futures';
import type { JsonObject } from '../../../common/types';
import { newClientOrderId } from '../../signing';

/** Ajoute `key` au payload si la valeur est définie. */
export function assign(
  payload: JsonObject,
  key: string,
  value: string | number | boolean | undefined,
): void {
  if (value !== undefined) {
    payload[key] = value;
  }
}

/** Construit la charge d'un ordre (partagée par `createOrder` et `batchOrders`). */
export function buildOrderPayload(params: NewOrderParams): JsonObject {
  const payload: JsonObject = {
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    newClientOrderId: params.newClientOrderId ?? newClientOrderId(),
  };
  assign(payload, 'positionSide', params.positionSide);
  assign(payload, 'timeInForce', params.timeInForce);
  assign(payload, 'quantity', params.quantity);
  assign(payload, 'reduceOnly', params.reduceOnly);
  assign(payload, 'price', params.price);
  assign(payload, 'stopPrice', params.stopPrice);
  assign(payload, 'closePosition', params.closePosition);
  assign(payload, 'activationPrice', params.activationPrice);
  assign(payload, 'callbackRate', params.callbackRate);
  assign(payload, 'workingType', params.workingType);
  assign(payload, 'priceProtect', params.priceProtect);
  assign(payload, 'newOrderRespType', params.newOrderRespType);
  assign(payload, 'pegPriceType', params.pegPriceType);
  assign(payload, 'pegOffset', params.pegOffset);
  assign(payload, 'priceLimit', params.priceLimit);
  assign(payload, 'stpMode', params.stpMode);
  return payload;
}

/** Référence un ordre par `orderId` (prioritaire) ou `origClientOrderId`. Lève si aucun. */
export function buildOrderRef(
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
