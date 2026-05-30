import type { ListenKey } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/**
 * Start (or return the active) user data stream `listenKey` (`USER_STREAM`). Valid 60 min;
 * a `POST` on an account with an active key returns it and extends its validity.
 */
export function createListenKey(label: string): Promise<ListenKey> {
  const { body, network } = buildSignedRequest({}, label);
  return httpPostForm<ListenKey>('futures', '/fapi/v3/listenKey', body, network);
}

/** Extend the `listenKey` validity by 60 min (`USER_STREAM`). */
export function keepAliveListenKey(label: string): Promise<Record<string, never>> {
  const { body, network } = buildSignedRequest({}, label);
  return httpPostForm<Record<string, never>>('futures', '/fapi/v3/listenKey', body, network, 'PUT');
}

/** Close the user data stream and invalidate the `listenKey` (`USER_STREAM`). */
export function closeListenKey(label: string): Promise<Record<string, never>> {
  const { body, network } = buildSignedRequest({}, label);
  return httpPostForm<Record<string, never>>(
    'futures',
    '/fapi/v3/listenKey',
    body,
    network,
    'DELETE',
  );
}
