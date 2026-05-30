import type { AsterClient } from '../../../common/config';
import type { SpotCommissionRate } from '../../../common/spot';
import { httpGet } from '../../client';

/** Maker/taker fees for a spot symbol. */
export function getCommissionRateSpot(
  client: AsterClient,
  symbol: string,
  label?: string,
): Promise<SpotCommissionRate> {
  return httpGet<SpotCommissionRate>(client, 'spot', '/api/v3/commissionRate', { symbol }, label);
}
