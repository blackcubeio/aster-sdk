import { httpGet } from '../../client';
import type { ServerTime } from '../types';

/** Current futures server time (ms). */
export function getServerTime(label?: string): Promise<ServerTime> {
  return httpGet<ServerTime>('futures', '/fapi/v3/time', undefined, label);
}
