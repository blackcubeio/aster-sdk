import type { Pair } from '../common/types';
import { PairConverter } from '../converters/pair';
import { getExchangeInfo } from './futures/market/get-exchange-info';
import { getExchangeInfoSpot } from './spot/market/get-exchange-info';

/**
 * Toutes les paires au **format unifié** `Pair` (futures + spot fusionnés, distingués par
 * `kind`). `maxLeverage` n'est pas exposé par l'exchangeInfo Aster (cf. leverageBracket) →
 * absent ici ; le natif hors cœur (dont `filters`) est conservé dans `xtras`.
 */
export function getPairs(label?: string): Promise<Pair[]> {
  const converter = new PairConverter();
  return Promise.all([getExchangeInfo(label), getExchangeInfoSpot(label)]).then(
    ([futures, spot]) => [
      ...futures.symbols.map((symbol) => converter.toCommon(symbol, 'perp')),
      ...spot.symbols.map((symbol) => converter.toCommon(symbol, 'spot')),
    ],
  );
}
