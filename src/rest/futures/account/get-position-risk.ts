import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { PositionRisk } from '../types';

/** Current position information, optionally filtered by symbol (`USER_DATA`). */
export function getPositionRisk(
  symbol: string | undefined,
  label: string,
): Promise<PositionRisk[]> {
  const { body, network } = buildSignedRequest({ symbol }, label);
  return httpGetSigned<PositionRisk[]>('futures', '/fapi/v3/positionRisk', body, network);
}
