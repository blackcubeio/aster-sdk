import type { AggTrade, AggTradesQuery } from '../../../common/futures';
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

/** Compressed/aggregate market trades. */
export function getAggTrades(query: AggTradesQuery, label?: string): Promise<AggTrade[]> {
  return httpGet<AggTradeWire[]>(
    'futures',
    '/fapi/v3/aggTrades',
    {
      symbol: query.symbol,
      fromId: query.fromId,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
    },
    label,
  ).then((wire) => wire.map(mapAggTrade));
}

function mapAggTrade(wire: AggTradeWire): AggTrade {
  return {
    aggTradeId: wire.a,
    price: wire.p,
    quantity: wire.q,
    firstTradeId: wire.f,
    lastTradeId: wire.l,
    timestamp: wire.T,
    isBuyerMaker: wire.m,
  };
}
