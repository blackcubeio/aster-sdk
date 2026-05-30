import type { AsterClient } from '../../../common/config';
import type { ListenKey } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Start (or return the active) spot user-data stream `listenKey` (`USER_STREAM`). */
export function createListenKeySpot(client: AsterClient, label: string): Promise<ListenKey> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<ListenKey>(client, 'spot', '/api/v3/listenKey', body, network);
}

/** Extend the spot `listenKey` validity by 60 min (`USER_STREAM`). */
export function keepAliveListenKeySpot(
  client: AsterClient,
  label: string,
): Promise<Record<string, never>> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<Record<string, never>>(
    client,
    'spot',
    '/api/v3/listenKey',
    body,
    network,
    'PUT',
  );
}

/** Close the spot user-data stream and invalidate the `listenKey` (`USER_STREAM`). */
export function closeListenKeySpot(
  client: AsterClient,
  label: string,
): Promise<Record<string, never>> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<Record<string, never>>(
    client,
    'spot',
    '/api/v3/listenKey',
    body,
    network,
    'DELETE',
  );
}
