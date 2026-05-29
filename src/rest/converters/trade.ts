import type { Trade } from '../../common/types';
import type { MarketTrade } from '../futures/types';
import type { SpotTrade } from '../spot/types';

/** Trade public natif Aster (futures `MarketTrade` ou `SpotTrade`, même cœur positionnel). */
export type TradeNative = MarketTrade | SpotTrade;

/**
 * Convertisseur **bijectif** trade : `toCommon(native) → Trade` / `toNative(trade) → native`.
 * `side` = direction du taker (= opposé du maker) déduite de `isBuyerMaker` ; `maker = null`
 * (Aster expose un trade par marché, pas un rôle de fill). `isBuyerMaker` + `quoteQty`/`baseQty`
 * vont dans `xtras` → bijection totale.
 */
export class TradeConverter {
  toCommon(wire: TradeNative): Trade {
    const { id, price, qty, time, ...rest } = wire;
    return {
      price,
      size: qty,
      side: (rest as { isBuyerMaker: boolean }).isBuyerMaker ? 'sell' : 'buy',
      maker: null,
      time,
      id,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(trade: Trade): TradeNative {
    return {
      id: trade.id as number,
      price: trade.price,
      qty: trade.size,
      time: trade.time,
      ...trade.xtras,
    } as unknown as TradeNative;
  }
}
