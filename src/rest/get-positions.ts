import type { AsterClient } from '../common/config';
import type { GetPositionsParams } from '../common/types';
import type { Position } from '../common/types';
import { PositionConverter, type PositionNative } from '../converters/position';
import { httpGetSigned } from './client';
import { buildSignedRequest } from './signing';

/** Positions ouvertes au **format unifié** `Position` (Aster `/fapi/v3/positionRisk`, **signé**). */
export function getPositions(
  client: AsterClient,
  params: GetPositionsParams,
  label: string,
): Promise<Position[]> {
  const converter = new PositionConverter();
  const { body, network } = buildSignedRequest(client, { symbol: params.name }, label);
  return httpGetSigned<PositionNative[]>(
    client,
    'futures',
    '/fapi/v3/positionRisk',
    body,
    network,
  ).then((wire) => wire.map((entry) => converter.toCommon(entry)));
}
