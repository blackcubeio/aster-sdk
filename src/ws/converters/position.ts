import type { Position } from '../../common/types';

/**
 * Élément de position du payload WS `ACCOUNT_UPDATE` Aster (`a.P[i]`) —
 * `{s, pa, ep, cr, up, mt, iw, ps, ma}`. `pa`=montant **signé** (long>0/short<0),
 * `ep`=prix d'entrée, `up`=PnL non réalisé, `iw`=marge isolée, `mt`=type de marge.
 */
export interface AccountPositionWsNative {
  s: string;
  pa: string;
  ep: string;
  cr: string;
  up: string;
  mt: string;
  iw: string;
  ps: string;
  ma: string;
  [key: string]: unknown;
}

/**
 * Convertisseur WS **unidirectionnel** position → {@link Position} (démux de `ACCOUNT_UPDATE.a.P`).
 * `side`/`size` dérivés du signe de `pa`. `markPrice`/`leverage`/`liquidationPrice` absents de ce
 * flux (`null`). `margin`=`iw`. Le hors-cœur (`cr/mt/ps/ma` + `pa` signé) va dans `xtras`.
 */
export class PositionWsConverter {
  toCommon(wire: AccountPositionWsNative): Position {
    const { s, pa, ep, up, iw, ...rest } = wire;
    const num = Number(pa);
    return {
      name: s,
      side: num > 0 ? 'long' : num < 0 ? 'short' : null,
      size: pa.replace('-', ''),
      entryPrice: ep,
      markPrice: null,
      unrealizedPnl: up,
      leverage: null,
      liquidationPrice: null,
      margin: iw,
      xtras: { ...rest, pa },
    };
  }
}
