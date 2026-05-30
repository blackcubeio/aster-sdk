import type { AsterClient } from '../../../common/config';
import { httpGet } from '../../client';

/** Test connectivity to the futures REST API. */
export function ping(client: AsterClient, label?: string): Promise<void> {
  return httpGet<Record<string, never>>(client, 'futures', '/fapi/v3/ping', undefined, label).then(
    () => undefined,
  );
}
