import { httpGet } from '../../client';
import type { SpotExchangeInfo, SpotSymbol } from '../types';

type SpotExchangeInfoWire = Omit<SpotExchangeInfo, 'symbols'> & {
  symbols: Omit<SpotSymbol, 'kind'>[];
};

/** Spot trading rules and symbol information. Chaque symbole porte `kind: 'spot'`. */
export function getExchangeInfoSpot(label?: string): Promise<SpotExchangeInfo> {
  return httpGet<SpotExchangeInfoWire>('spot', '/api/v3/exchangeInfo', undefined, label).then(
    (info) => ({
      ...info,
      symbols: info.symbols.map((symbol) => ({ ...symbol, kind: 'spot' as const })),
    }),
  );
}
