import type { Pair } from '../common/types';
import { getExchangeInfo } from './futures/market/get-exchange-info';
import type { FuturesSymbol } from './futures/types';
import { getExchangeInfoSpot } from './spot/market/get-exchange-info';
import type { SpotSymbol } from './spot/types';

function filterValue(
  filters: { filterType: string }[],
  type: string,
  key: string,
): string | undefined {
  const found = filters.find((filter) => filter.filterType === type) as
    | Record<string, unknown>
    | undefined;
  const value = found?.[key];
  return typeof value === 'string' ? value : undefined;
}

function futuresToPair(symbol: FuturesSymbol): Pair {
  return {
    name: symbol.symbol,
    base: symbol.baseAsset,
    quote: symbol.quoteAsset,
    kind: 'perp',
    szDecimals: symbol.quantityPrecision,
    tickSize: filterValue(symbol.filters, 'PRICE_FILTER', 'tickSize'),
    stepSize: filterValue(symbol.filters, 'LOT_SIZE', 'stepSize'),
    minNotional: filterValue(symbol.filters, 'MIN_NOTIONAL', 'notional'),
    status: symbol.status,
    raw: symbol as unknown as Record<string, unknown>,
  };
}

function spotToPair(symbol: SpotSymbol): Pair {
  return {
    name: symbol.symbol,
    base: symbol.baseAsset,
    quote: symbol.quoteAsset,
    kind: 'spot',
    szDecimals: symbol.quantityPrecision,
    tickSize: filterValue(symbol.filters, 'PRICE_FILTER', 'tickSize'),
    stepSize: filterValue(symbol.filters, 'LOT_SIZE', 'stepSize'),
    minNotional: filterValue(symbol.filters, 'MIN_NOTIONAL', 'minNotional'),
    status: symbol.status,
    raw: symbol as unknown as Record<string, unknown>,
  };
}

/**
 * Toutes les paires au **format unifié** `Pair` (futures + spot fusionnés, distingués par
 * `kind`). `maxLeverage` n'est pas exposé par l'exchangeInfo Aster (cf. leverageBracket) →
 * absent ici ; `raw` contient le symbole d'origine complet.
 */
export function getPairs(label?: string): Promise<Pair[]> {
  return Promise.all([getExchangeInfo(label), getExchangeInfoSpot(label)]).then(
    ([futures, spot]) => [...futures.symbols.map(futuresToPair), ...spot.symbols.map(spotToPair)],
  );
}
