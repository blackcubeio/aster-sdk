import type { AsterClient } from '../../../common/config';
import { httpGet } from '../../client';

/** Test connectivity to the spot REST API. */
export function pingSpot(client: AsterClient, label?: string): Promise<void> {
  return httpGet<Record<string, never>>(client, 'spot', '/api/v3/ping', undefined, label).then(
    () => undefined,
  );
}
