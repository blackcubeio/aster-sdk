import type { AsterClient } from '../../../common/config';
import type { SpotServerTime } from '../../../common/spot';
import { httpGet } from '../../client';

/** Current spot server time (ms). */
export function getServerTimeSpot(client: AsterClient, label?: string): Promise<SpotServerTime> {
  return httpGet<SpotServerTime>(client, 'spot', '/api/v3/time', undefined, label);
}
