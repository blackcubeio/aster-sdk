import type { SpotAggTrade, SpotAggTradesQuery } from '../../../common/spot';
import { httpGet } from '../../client';

interface AggTradeWire {
  a: number;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
}

/** Compressed/aggregate spot trades. */
export function getAggTradesSpot(
  query: SpotAggTradesQuery,
  label?: string,
): Promise<SpotAggTrade[]> {
  return httpGet<AggTradeWire[]>(
    'spot',
    '/api/v3/aggTrades',
    {
      symbol: query.symbol,
      fromId: query.fromId,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
    },
    label,
  ).then((wire) =>
    wire.map((entry) => ({
      aggTradeId: entry.a,
      price: entry.p,
      quantity: entry.q,
      firstTradeId: entry.f,
      lastTradeId: entry.l,
      timestamp: entry.T,
      isBuyerMaker: entry.m,
    })),
  );
}
