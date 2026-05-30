import type { AsterClient } from '../common/config';
import type { GetTradesParams } from '../common/types';
import type { MarketKind, Trade } from '../common/types';
import { TradeConverter, type TradeNative } from '../converters/trade';
import { httpGet } from './client';

/** Trades publics récents au **format unifié** `Trade` (route futures/spot via `kind`). */
export function getTrades(
  client: AsterClient,
  params: GetTradesParams,
  label?: string,
): Promise<Trade[]> {
  const kind = params.kind ?? 'perp';
  const converter = new TradeConverter();
  const [product, path] =
    kind === 'spot'
      ? (['spot', '/api/v3/trades'] as const)
      : (['futures', '/fapi/v3/trades'] as const);
  return httpGet<TradeNative[]>(
    client,
    product,
    path,
    { symbol: params.name, limit: params.limit },
    label,
  ).then((wire) => wire.map((entry) => converter.toCommon(entry)));
}
