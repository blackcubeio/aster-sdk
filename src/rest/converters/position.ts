import type { Position } from '../../common/types';
import type { PositionRisk } from '../futures/types';

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
