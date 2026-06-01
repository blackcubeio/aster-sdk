import type { FuturesSymbol } from '../common/futures';
import type { SpotSymbol } from '../common/spot';
import type { MarketKind, Pair } from '../common/types';

type AsterSymbol = FuturesSymbol | SpotSymbol;

/** Lit la valeur d'un filtre Aster (`PRICE_FILTER`/`LOT_SIZE`/`MIN_NOTIONAL`). */
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

/**
 * Convertisseur **bijectif** paire : `toCommon(symbol, kind) → Pair` / `toNative(pair) → symbol`.
 * Le cœur unifié est extrait du symbole ; **tout le reste** (dont `filters`, source des
 * `tickSize/stepSize/minNotional` dérivés) va dans `xtras` → `toNative(toCommon(x)) ≡ x`.
 * `kind` vient du produit appelant (futures/spot), absent du symbole natif.
 */
export class PairConverter {
  toCommon(symbol: AsterSymbol, kind: MarketKind): Pair {
    const { symbol: name, baseAsset, quoteAsset, quantityPrecision, status, ...rest } = symbol;
    const notionalKey = kind === 'spot' ? 'minNotional' : 'notional';
    const pair: Pair = {
      name,
      base: baseAsset,
      quote: quoteAsset,
      kind,
      szDecimals: quantityPrecision,
      tickSize: filterValue(symbol.filters, 'PRICE_FILTER', 'tickSize'),
      stepSize: filterValue(symbol.filters, 'LOT_SIZE', 'stepSize'),
      minNotional: filterValue(symbol.filters, 'MIN_NOTIONAL', notionalKey),
      status,
    };
    if (Object.keys(rest).length > 0) {
      pair.xtras = rest as Record<string, unknown>;
    }
    return pair;
  }

  toNative(pair: Pair): AsterSymbol {
    return {
      symbol: pair.name,
      baseAsset: pair.base,
      quoteAsset: pair.quote,
      quantityPrecision: pair.szDecimals,
      status: pair.status,
      ...pair.xtras,
    } as AsterSymbol;
  }
}
