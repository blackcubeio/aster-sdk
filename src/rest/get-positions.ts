import type { Position } from '../common/types';
import { httpGetSigned } from './client';
import { PositionConverter, type PositionNative } from './converters/position';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés. `user` ignoré côté Aster (compte = signataire de `label`). */
export interface GetPositionsParams {
  /** Adresse du compte (HL/Pacifica) ; Aster utilise le signataire de `label`. */
  user?: string;
  /** Filtre optionnel sur une paire. */
  name?: string;
}

/** Positions ouvertes au **format unifié** `Position` (Aster `/fapi/v3/positionRisk`, **signé**). */
export function getPositions(params: GetPositionsParams, label: string): Promise<Position[]> {
  const converter = new PositionConverter();
  const { body, network } = buildSignedRequest({ symbol: params.name }, label);
  return httpGetSigned<PositionNative[]>('futures', '/fapi/v3/positionRisk', body, network).then(
    (wire) => wire.map((entry) => converter.toCommon(entry)),
  );
}
