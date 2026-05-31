import type { Ticker24hr } from '../common/futures';
import type { Price } from '../common/types';

/**
 * Convertisseur **unidirectionnel** ticker 24 h Aster (`/ticker/24hr`) → {@link Price} (type commun).
 * Réutilise le cœur prix : `last` = `lastPrice`, `volume24h` = `quoteVolume` (notionnel),
 * `prevDayPrice` = `prevClosePrice`, `time` = `closeTime`. `mark`/`oracle`/`mid`/`bid`/`ask`/
 * `funding`/`openInterest` ne sont pas fournis par ce endpoint (`null`). Les statistiques propres
 * au ticker (`priceChange`, `weightedAvgPrice`, `highPrice`, `lowPrice`, `volume` base, `count`…)
 * vont dans `xtras` — rien n'est jeté.
 */
export class Ticker24hrConverter {
  toCommon(wire: Ticker24hr): Price {
    const {
      symbol,
      lastPrice,
      quoteVolume,
      prevClosePrice,
      closeTime,
      priceChange,
      priceChangePercent,
      weightedAvgPrice,
      lastQty,
      openPrice,
      highPrice,
      lowPrice,
      volume,
      openTime,
      firstId,
      lastId,
      count,
    } = wire;
    return {
      name: symbol,
      kind: 'perp',
      mark: null,
      oracle: null,
      mid: null,
      bid: null,
      ask: null,
      last: lastPrice,
      funding: null,
      openInterest: null,
      volume24h: quoteVolume,
      prevDayPrice: prevClosePrice,
      time: closeTime,
      xtras: {
        priceChange,
        priceChangePercent,
        weightedAvgPrice,
        lastQty,
        openPrice,
        highPrice,
        lowPrice,
        volume,
        openTime,
        firstId,
        lastId,
        count,
      },
    };
  }
}
