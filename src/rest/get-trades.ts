import type { MarketKind, Trade } from '../common/types';
import { httpGet } from './client';
import { TradeConverter, type TradeNative } from '../converters/trade';

/** Paramètres unifiés (mêmes champs sur les SDK qui exposent les trades publics). */
export interface GetTradesParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Nombre de trades. */
  limit?: number;
}

/** Trades publics récents au **format unifié** `Trade` (route futures/spot via `kind`). */
export function getTrades(params: GetTradesParams, label?: string): Promise<Trade[]> {
  const kind = params.kind ?? 'perp';
  const converter = new TradeConverter();
  const [product, path] =
    kind === 'spot'
      ? (['spot', '/api/v3/trades'] as const)
      : (['futures', '/fapi/v3/trades'] as const);
  return httpGet<TradeNative[]>(
    product,
    path,
    { symbol: params.name, limit: params.limit },
    label,
  ).then((wire) => wire.map((entry) => converter.toCommon(entry)));
}
