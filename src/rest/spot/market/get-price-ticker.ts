import type { AsterClient } from '../../../common/config';
import type { SpotPriceTicker } from '../../../common/spot';
import { httpGet } from '../../client';

/** Latest spot price for one symbol, or all symbols when omitted. */
export function getPriceTickerSpot(
  client: AsterClient,
  symbol: string,
  label?: string,
): Promise<SpotPriceTicker>;
export function getPriceTickerSpot(
  client: AsterClient,
  symbol?: undefined,
  label?: string,
): Promise<SpotPriceTicker[]>;
export function getPriceTickerSpot(
  client: AsterClient,
  symbol?: string,
  label?: string,
): Promise<SpotPriceTicker | SpotPriceTicker[]> {
  return httpGet<SpotPriceTicker | SpotPriceTicker[]>(
    client,
    'spot',
    '/api/v3/ticker/price',
    { symbol },
    label,
  );
}
