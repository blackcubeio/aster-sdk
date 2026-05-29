import type { UserTrade } from '../../common/types';
import type { FuturesUserTrade } from '../futures/types';

/** Fill natif Aster (futures `FuturesUserTrade`). */
export type UserTradeNative = FuturesUserTrade;

/**
 * Convertisseur **bijectif** fill : `toCommon(native) → UserTrade` / inverse.
 * `side` dérivé (BUY/SELL ; natif gardé dans xtras) ; positionSide/quoteQty/buyer → `xtras`.
 */
export class UserTradeConverter {
  toCommon(wire: UserTradeNative): UserTrade {
    const {
      id,
      orderId,
      symbol,
      price,
      qty,
      realizedPnl,
      commission,
      commissionAsset,
      maker,
      time,
      ...rest
    } = wire;
    return {
      name: symbol,
      kind: 'perp',
      id: String(id),
      orderId: String(orderId),
      side: (rest.side as string) === 'SELL' ? 'sell' : 'buy',
      price,
      size: qty,
      fee: commission,
      feeAsset: commissionAsset,
      pnl: realizedPnl,
      maker,
      time,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(trade: UserTrade): UserTradeNative {
    return {
      id: Number(trade.id),
      orderId: Number(trade.orderId),
      symbol: trade.name,
      price: trade.price,
      qty: trade.size,
      realizedPnl: trade.pnl as string,
      commission: trade.fee,
      commissionAsset: trade.feeAsset as string,
      maker: trade.maker as boolean,
      time: trade.time,
      ...trade.xtras,
    } as unknown as UserTradeNative;
  }
}
