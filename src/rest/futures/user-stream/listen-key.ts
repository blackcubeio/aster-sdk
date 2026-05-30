import type { AsterClient } from '../../../common/config';
import type { ListenKey } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/**
 * Start (or return the active) user data stream `listenKey` (`USER_STREAM`). Valid 60 min;
 * a `POST` on an account with an active key returns it and extends its validity.
 */
export function createListenKey(client: AsterClient, label: string): Promise<ListenKey> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<ListenKey>(client, 'futures', '/fapi/v3/listenKey', body, network);
}

/** Extend the `listenKey` validity by 60 min (`USER_STREAM`). */
export function keepAliveListenKey(
  client: AsterClient,
  label: string,
): Promise<Record<string, never>> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<Record<string, never>>(
    client,
    'futures',
    '/fapi/v3/listenKey',
    body,
    network,
    'PUT',
  );
}

/** Close the user data stream and invalidate the `listenKey` (`USER_STREAM`). */
export function closeListenKey(client: AsterClient, label: string): Promise<Record<string, never>> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpPostForm<Record<string, never>>(
    client,
    'futures',
    '/fapi/v3/listenKey',
    body,
    network,
    'DELETE',
  );
}
