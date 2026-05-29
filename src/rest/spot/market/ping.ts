import { httpGet } from '../../client';

/** Test connectivity to the spot REST API. */
export function pingSpot(label?: string): Promise<void> {
  return httpGet<Record<string, never>>('spot', '/api/v3/ping', undefined, label).then(
    () => undefined,
  );
}
