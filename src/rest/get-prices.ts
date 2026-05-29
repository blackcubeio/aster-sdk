import type { Price } from '../common/types';
import { httpGet } from './client';
import { PriceConverter, type PriceNative } from './converters/price';

/**
 * Prix de tous les marchés au **format unifié** `Price` (Aster : mark price / funding via
 * `/fapi/v3/premiumIndex`). `mid`/`openInterest`/`volume24h`/`prevDayPrice` non fournis par
 * ce endpoint (`null`).
 */
export function getPrices(label?: string): Promise<Price[]> {
  const converter = new PriceConverter();
  return httpGet<PriceNative[]>('futures', '/fapi/v3/premiumIndex', {}, label).then((wire) =>
    wire.map((entry) => converter.toCommon(entry)),
  );
}
