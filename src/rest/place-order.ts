import type { MarketKind, Order, Side } from '../common/types';
import { OrderSide, OrderType, TimeInForce } from '../common/types';
import { OrderConverter } from '../converters/order';
import { createOrder } from './futures/trade/new-order';

/** Type d'ordre unifié accepté par `placeOrder`. */
export type PlaceOrderType =
  | 'limit'
  | 'market'
  | 'stop'
  | 'stopMarket'
  | 'takeProfit'
  | 'takeProfitMarket';

/** Time-in-force unifié. */
export type PlaceOrderTif = 'gtc' | 'ioc' | 'fok' | 'alo';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface PlaceOrderParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Sens. */
  side: Side;
  /** Type d'ordre. */
  type: PlaceOrderType;
  /** Quantité (chaîne décimale). */
  size: string;
  /** Prix limite (requis pour les ordres `limit`). */
  price?: string;
  /** Prix de déclenchement (stop/take-profit). */
  triggerPrice?: string;
  /** Time-in-force ; défaut exchange. */
  tif?: PlaceOrderTif;
  /** Reduce-only. */
  reduceOnly?: boolean;
  /** Client order id. */
  clientId?: string;
}

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
export function placeOrder(params: PlaceOrderParams, label: string): Promise<Order> {
  const converter = new OrderConverter();
  return createOrder(
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
