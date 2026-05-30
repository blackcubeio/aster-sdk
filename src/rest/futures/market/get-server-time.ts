import type { ServerTime } from '../../../common/futures';
import { httpGet } from '../../client';

/** Current futures server time (ms). */
export function getServerTime(label?: string): Promise<ServerTime> {
  return httpGet<ServerTime>('futures', '/fapi/v3/time', undefined, label);
}
