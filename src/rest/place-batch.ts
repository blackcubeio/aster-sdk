import type { AsterClient } from '../common/config';
import type { BatchOrderResult, NewOrderParams } from '../common/futures';
import type { Order, PlaceOrderParams, PlaceOrderTif, PlaceOrderType, Side } from '../common/types';
import { OrderSide, OrderType, TimeInForce } from '../common/types';
import { OrderConverter } from '../converters/order';
import { httpPostForm } from './client';
import { buildOrderPayload } from './futures/trade/payloads';
import { buildSignedRequest } from './signing';

const SIDE: Record<Side, OrderSide> = { buy: OrderSide.Buy, sell: OrderSide.Sell };
const TYPE: Record<PlaceOrderType, OrderType> = {
  limit: OrderType.Limit,
  market: OrderType.Market,
  stop: OrderType.Stop,
  stopMarket: OrderType.StopMarket,
  takeProfit: OrderType.TakeProfit,
  takeProfitMarket: OrderType.TakeProfitMarket,
};
const TIF: Record<PlaceOrderTif, TimeInForce> = {
  gtc: TimeInForce.Gtc,
  ioc: TimeInForce.Ioc,
  fok: TimeInForce.Fok,
  alo: TimeInForce.Gtx,
};

/** Un `BatchOrderResult` natif est une erreur `{ code, msg }` (pas un ordre) ? */
function isError(r: BatchOrderResult): r is { code: number; msg: string } {
  return (r as { orderId?: number }).orderId === undefined;
}

/**
 * Place un **lot** d'ordres au **format unifié** (écriture signée, Aster futures `/batchOrders`,
 * jusqu'à 5 legs). Entrée = legs en **vocabulaire commun** ({@link PlaceOrderParams}, sans `kind`,
 * tous perp) ; sortie = `Order[]` (type commun), **1 `Order` par leg** dans l'ordre d'entrée.
 * Un leg en erreur (rejeté par l'exchange) devient un `Order` `status: 'rejected'` (`id: ''`),
 * le code/msg natif étant conservé dans `xtras` — rien n'est jeté, même normalisation que `place`.
 */
export function placeBatchOrders(
  client: AsterClient,
  orders: PlaceOrderParams[],
  label: string,
): Promise<Order[]> {
  const converter = new OrderConverter();
  const batch = orders.map<NewOrderParams>((o) => ({
    symbol: o.name,
    side: SIDE[o.side],
    type: TYPE[o.type],
    quantity: o.size,
    price: o.price,
    stopPrice: o.triggerPrice,
    timeInForce: o.tif === undefined ? undefined : TIF[o.tif],
    reduceOnly: o.reduceOnly,
    newClientOrderId: o.clientId,
  }));
  const payload = batch.map((order) => buildOrderPayload(order));
  const { body, network } = buildSignedRequest(client, { batchOrders: payload }, label);
  return httpPostForm<BatchOrderResult[]>(
    client,
    'futures',
    '/fapi/v3/batchOrders',
    body,
    network,
  ).then((results) =>
    results.map((res, i) => {
      if (isError(res)) {
        const leg = orders[i] as PlaceOrderParams;
        return {
          name: leg.name,
          kind: 'perp' as const,
          id: '',
          clientId: leg.clientId ?? null,
          side: leg.side,
          type: leg.type,
          price: leg.price ?? null,
          size: leg.size,
          filled: '0',
          status: 'rejected' as const,
          tif: leg.tif ?? null,
          reduceOnly: leg.reduceOnly ?? null,
          time: Date.now(),
          xtras: { code: res.code, msg: res.msg },
        };
      }
      return converter.toCommon(res);
    }),
  );
}
