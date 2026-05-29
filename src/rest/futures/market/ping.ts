import { httpGet } from '../../client';

/** Test connectivity to the futures REST API. */
export function ping(label?: string): Promise<void> {
  return httpGet<Record<string, never>>('futures', '/fapi/v3/ping', undefined, label).then(
    () => undefined,
  );
}
