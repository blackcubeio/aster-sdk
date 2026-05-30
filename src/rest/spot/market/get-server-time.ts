import type { SpotServerTime } from '../../../common/spot';
import { httpGet } from '../../client';

/** Current spot server time (ms). */
export function getServerTimeSpot(label?: string): Promise<SpotServerTime> {
  return httpGet<SpotServerTime>('spot', '/api/v3/time', undefined, label);
}
