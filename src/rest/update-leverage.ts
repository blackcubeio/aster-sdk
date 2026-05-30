import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface UpdateLeverageParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Levier cible (entier). */
  leverage: number;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Confirmation unifiée d'un changement de levier. */
export interface LeverageUpdate {
  /** Paire/symbole. */
  name: string;
  /** Levier appliqué. */
  leverage: number;
  /** Détails natifs hors cœur (rien jeté). */
  xtras?: Record<string, unknown>;
}

interface LeverageResultWire {
  symbol: string;
  leverage: number;
  maxNotionalValue: string;
}

/** Change le levier initial d'une paire (**écriture signée**, Aster `/fapi/v3/leverage`). */
export function updateLeverage(
  params: UpdateLeverageParams,
  label: string,
): Promise<LeverageUpdate> {
  const { body, network } = buildSignedRequest(
    { symbol: params.name, leverage: params.leverage },
    label,
  );
  return httpPostForm<LeverageResultWire>('futures', '/fapi/v3/leverage', body, network).then(
    (res) => ({
      name: res.symbol,
      leverage: res.leverage,
      xtras: { maxNotionalValue: res.maxNotionalValue },
    }),
  );
}
