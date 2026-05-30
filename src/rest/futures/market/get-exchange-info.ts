import type { ExchangeInfo, FuturesSymbol } from '../../../common/futures';
import { httpGet } from '../../client';

type ExchangeInfoWire = Omit<ExchangeInfo, 'symbols'> & {
  symbols: Omit<FuturesSymbol, 'kind'>[];
};

/** Current exchange trading rules and symbol information. Chaque symbole porte `kind: 'perp'`. */
export function getExchangeInfo(label?: string): Promise<ExchangeInfo> {
  return httpGet<ExchangeInfoWire>('futures', '/fapi/v3/exchangeInfo', undefined, label).then(
    (info) => ({
      ...info,
      symbols: info.symbols.map((symbol) => ({ ...symbol, kind: 'perp' as const })),
    }),
  );
}
