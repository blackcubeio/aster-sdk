import type { AsterClient } from '../common/config';
import type { PlaceOrderParams, PlaceOrderTif, PlaceOrderType } from '../common/types';
import type { Order, Side } from '../common/types';
import { OrderSide, OrderType, TimeInForce } from '../common/types';
import { OrderConverter } from '../converters/order';
import { createOrder } from './futures/trade/new-order';

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

/**
 * Passe un ordre au **format unifié** (**écriture signée**, Aster futures `/fapi/v3/order`).
 * Mappe les params unifiés vers l'ordre natif, puis convertit la réponse en `Order` unifié.
 */
export function placeOrder(
  client: AsterClient,
  params: PlaceOrderParams,
  label: string,
): Promise<Order> {
  const converter = new OrderConverter();
  return createOrder(
    client,
    {
      symbol: params.name,
      side: SIDE[params.side],
      type: TYPE[params.type],
      quantity: params.size,
      price: params.price,
      stopPrice: params.triggerPrice,
      timeInForce: params.tif === undefined ? undefined : TIF[params.tif],
      reduceOnly: params.reduceOnly,
      newClientOrderId: params.clientId,
    },
    label,
  ).then((order) => converter.toCommon(order));
}
