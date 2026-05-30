import type { Order } from '../../common/types';

const TYPE: Record<string, Order['type']> = {
  LIMIT: 'limit',
  MARKET: 'market',
  STOP: 'stop',
  STOP_MARKET: 'stopMarket',
  TAKE_PROFIT: 'takeProfit',
  TAKE_PROFIT_MARKET: 'takeProfitMarket',
  TRAILING_STOP_MARKET: 'trailingStop',
};
const STATUS: Record<string, Order['status']> = {
  NEW: 'open',
  PARTIALLY_FILLED: 'partiallyFilled',
  FILLED: 'filled',
  CANCELED: 'canceled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};
const TIF: Record<string, Order['tif']> = { GTC: 'gtc', IOC: 'ioc', FOK: 'fok', GTX: 'alo' };

/**
 * Payload WS `ORDER_TRADE_UPDATE` Aster (format Binance) — `{e, E, T, o}`. L'ordre est dans `o`
 * (clés courtes : `s`=symbole, `c`=clientId, `S`=side, `o`=type, `f`=tif, `q`=taille,
 * `p`=prix, `X`=statut, `i`=orderId, `z`=cumul exécuté, `R`=reduceOnly, `T`=temps).
 */
export interface OrderTradeUpdateWsNative {
  e: string;
  E: number;
  T: number;
  o: {
    s: string;
    c: string;
    S: string;
    o: string;
    f: string;
    q: string;
    p: string;
    X: string;
    i: number;
    z: string;
    R: boolean;
    T: number;
    [key: string]: unknown;
  };
}

/**
 * Convertisseur WS **unidirectionnel** ordre → {@link Order} (démux du flux user-data).
 * Les valeurs natives (S/o/f/X + champs hors cœur + wrapper e/E) vont dans `xtras` — rien jeté.
 */
export class OrderWsConverter {
  toCommon(msg: OrderTradeUpdateWsNative): Order {
    const { s, c, S, o, f, q, p, X, i, z, R, T, ...rest } = msg.o;
    return {
      name: s,
      kind: 'perp',
      id: String(i),
      clientId: c === '' ? null : c,
      side: S === 'SELL' ? 'sell' : 'buy',
      type: TYPE[o] ?? 'other',
      price: p,
      size: q,
      filled: z,
      status: STATUS[X] ?? 'other',
      tif: TIF[f] ?? null,
      reduceOnly: R,
      time: T,
      xtras: { ...rest, S, o, f, X, e: msg.e, E: msg.E, eventTime: msg.T },
    };
  }
}
