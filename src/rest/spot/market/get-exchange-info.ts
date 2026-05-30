import type { AsterClient } from '../../../common/config';
import type { SpotExchangeInfo, SpotSymbol } from '../../../common/spot';
import { httpGet } from '../../client';

type SpotExchangeInfoWire = Omit<SpotExchangeInfo, 'symbols'> & {
  symbols: Omit<SpotSymbol, 'kind'>[];
};

/** Spot trading rules and symbol information. Chaque symbole porte `kind: 'spot'`. */
export function getExchangeInfoSpot(
  client: AsterClient,
  label?: string,
): Promise<SpotExchangeInfo> {
  return httpGet<SpotExchangeInfoWire>(
    client,
    'spot',
    '/api/v3/exchangeInfo',
    undefined,
    label,
  ).then((info) => ({
    ...info,
    symbols: info.symbols.map((symbol) => ({ ...symbol, kind: 'spot' as const })),
  }));
}
