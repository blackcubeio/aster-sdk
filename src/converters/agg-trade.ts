import type { AggTrade } from '../common/futures';
import type { Trade } from '../common/types';

/**
 * Convertisseur **unidirectionnel** trade agrégé Aster (`/aggTrades`) → {@link Trade} (type commun).
 * Un `AggTrade` regroupe plusieurs fills exécutés au même prix : `id` = `aggTradeId`,
 * `side` = direction du **taker** (= opposé du maker : `isBuyerMaker` ⇒ l'acheteur est maker ⇒
 * le taker **vend**), `maker = null` (trade public). `firstTradeId`/`lastTradeId`/`isBuyerMaker`
 * vont dans `xtras` — rien n'est jeté.
 */
export class AggTradeConverter {
  toCommon(wire: AggTrade): Trade {
    const { aggTradeId, price, quantity, timestamp, isBuyerMaker, firstTradeId, lastTradeId } =
      wire;
    return {
      price,
      size: quantity,
      side: isBuyerMaker ? 'sell' : 'buy',
      maker: null,
      time: timestamp,
      id: aggTradeId,
      xtras: { firstTradeId, lastTradeId, isBuyerMaker },
    };
  }
}
