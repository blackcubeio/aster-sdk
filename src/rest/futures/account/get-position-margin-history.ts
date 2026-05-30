import type { AsterClient } from '../../../common/config';
import type {
  PositionMarginHistoryEntry,
  PositionMarginHistoryQuery,
} from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** History of isolated position margin changes (`USER_DATA`). */
export function getPositionMarginHistory(
  client: AsterClient,
  query: PositionMarginHistoryQuery,
  label: string,
): Promise<PositionMarginHistoryEntry[]> {
  const { body, network } = buildSignedRequest(client, { ...query }, label);
  return httpGetSigned<PositionMarginHistoryEntry[]>(
    client,
    'futures',
    '/fapi/v3/positionMargin/history',
    body,
    network,
  );
}
