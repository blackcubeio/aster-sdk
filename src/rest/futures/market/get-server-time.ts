import type { AsterClient } from '../../../common/config';
import type { ServerTime } from '../../../common/futures';
import { httpGet } from '../../client';

/** Current futures server time (ms). */
export function getServerTime(client: AsterClient, label?: string): Promise<ServerTime> {
  return httpGet<ServerTime>(client, 'futures', '/fapi/v3/time', undefined, label);
}
