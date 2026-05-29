import type { JsonObject } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest, newClientOrderId } from '../../signing';
import type { NewOrderParams, Order } from '../types';

/**
 * Place a new futures order (`TRADE`, signé par l'agent). Endpoint témoin qui valide la
 * chaîne de signature bout-en-bout. Un `newClientOrderId` est généré si absent.
 */
export function createOrder(params: NewOrderParams, label: string): Promise<Order> {
  const { body, network } = buildSignedRequest(buildOrderPayload(params), label);
  return httpPostForm<Order>('futures', '/fapi/v3/order', body, network);
}

function buildOrderPayload(params: NewOrderParams): JsonObject {
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

function assign(payload: JsonObject, key: string, value: string | boolean | undefined): void {
  if (value !== undefined) {
    payload[key] = value;
  }
}
