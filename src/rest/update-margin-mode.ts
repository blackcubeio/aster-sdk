import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { MarginType } from './futures/types';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface UpdateMarginModeParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** `true` = marge isolée, `false` = cross. */
  isolated: boolean;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Bascule une paire entre marge isolée et cross (**écriture signée**, Aster `/fapi/v3/marginType`). */
export function updateMarginMode(params: UpdateMarginModeParams, label: string): Promise<void> {
  const { body, network } = buildSignedRequest(
    { symbol: params.name, marginType: params.isolated ? MarginType.Isolated : MarginType.Crossed },
    label,
  );
  return httpPostForm('futures', '/fapi/v3/marginType', body, network).then(() => undefined);
}
