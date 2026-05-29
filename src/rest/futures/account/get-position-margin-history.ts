import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { PositionMarginHistoryEntry, PositionMarginHistoryQuery } from '../types';

/** History of isolated position margin changes (`USER_DATA`). */
export function getPositionMarginHistory(
  query: PositionMarginHistoryQuery,
  label: string,
): Promise<PositionMarginHistoryEntry[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<PositionMarginHistoryEntry[]>(
    'futures',
    '/fapi/v3/positionMargin/history',
    body,
    network,
  );
}
