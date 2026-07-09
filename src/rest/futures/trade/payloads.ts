import type { NewOrderParams } from '../../../common/futures';
import { type JsonObject, OrderType } from '../../../common/types';
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

/**
 * Ajoute un booléen SÉRIALISÉ EN STRING (`"true"`/`"false"`). La doc Aster type `reduceOnly`,
 * `closePosition` et `priceProtect` en STRING, pas en booléen. En form-encoding un booléen se stringifie
 * de lui-même (`String(true)`), mais dans le JSON du `batchOrders` un booléen natif est REJETÉ (code 400) →
 * on stringifie à la source, valable pour les deux chemins (unitaire ET batch).
 */
export function assignBool(payload: JsonObject, key: string, value: boolean | undefined): void {
  if (value !== undefined) {
    payload[key] = value ? 'true' : 'false';
  }
}

/**
 * Types d'ordre qui PORTENT un `price` selon la doc Aster (« Mandatory parameters by order type ») :
 * LIMIT, STOP, TAKE_PROFIT. Les variantes marché — MARKET, STOP_MARKET, TAKE_PROFIT_MARKET,
 * TRAILING_STOP_MARKET — se déclenchent/exécutent au marché : `price` y est INTERDIT (la venue rejette
 * « Parameter 'price' sent when not required »). Filtré au point d'assemblage, jamais chez l'appelant.
 */
const PRICE_BEARING_TYPES: ReadonlySet<OrderType> = new Set([
  OrderType.Limit,
  OrderType.Stop,
  OrderType.TakeProfit,
]);

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
  assignBool(payload, 'reduceOnly', params.reduceOnly);
  assign(payload, 'price', PRICE_BEARING_TYPES.has(params.type) ? params.price : undefined);
  assign(payload, 'stopPrice', params.stopPrice);
  assignBool(payload, 'closePosition', params.closePosition);
  assign(payload, 'activationPrice', params.activationPrice);
  assign(payload, 'callbackRate', params.callbackRate);
  assign(payload, 'workingType', params.workingType);
  assignBool(payload, 'priceProtect', params.priceProtect);
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
