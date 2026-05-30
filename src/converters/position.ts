import type { Position } from '../common/types';
import type { PositionRisk } from '../rest/futures/types';

/** Position native Aster (`/fapi/v3/positionRisk`). */
export type PositionNative = PositionRisk;

/**
 * Convertisseur **bijectif** position : `toCommon(native) → Position` / inverse.
 * `side`/`size` dérivés du `positionAmt` signé, `leverage` du champ `leverage` — sources
 * conservées dans `xtras` (avec positionSide, marginType…) → `toNative` les restitue. Bijection totale.
 */
export class PositionConverter {
  toCommon(wire: PositionNative): Position {
    const {
      symbol,
      entryPrice,
      markPrice,
      unRealizedProfit,
      liquidationPrice,
      isolatedMargin,
      ...rest
    } = wire;
    const amt = rest.positionAmt;
    const num = Number(amt);
    return {
      name: symbol,
      side: num > 0 ? 'long' : num < 0 ? 'short' : null,
      size: amt.replace('-', ''),
      entryPrice,
      markPrice,
      unrealizedPnl: unRealizedProfit,
      leverage: Number(rest.leverage),
      liquidationPrice,
      margin: isolatedMargin,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(position: Position): PositionNative {
    return {
      symbol: position.name,
      entryPrice: position.entryPrice as string,
      markPrice: position.markPrice as string,
      unRealizedProfit: position.unrealizedPnl as string,
      liquidationPrice: position.liquidationPrice as string,
      isolatedMargin: position.margin as string,
      ...position.xtras,
    } as unknown as PositionNative;
  }
}

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

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
