import { httpGet } from '../../client';
import type { SpotServerTime } from '../types';

/** Current spot server time (ms). */
export function getServerTimeSpot(label?: string): Promise<SpotServerTime> {
  return httpGet<SpotServerTime>('spot', '/api/v3/time', undefined, label);
}
