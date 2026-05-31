import type { ChaseOrder, StrategyOrder } from '../common/futures';
import type { Side } from '../common/types';

/**
 * Ordre **chase** (peg BBO auto-re-pricé) au format normalisé Aster. Pas d'équivalent commun
 * (c'est une stratégie, pas un ordre simple) → interface dédiée, mais aux **mêmes noms de
 * propriété que le cœur commun** (`name`/`side`/`size`/`status`/`reduceOnly`/`time`/`id`).
 * Le surplus natif (offsets de chase, `quantityUnit`, `clientStrategyId`…) va dans `xtras`.
 */
export interface ChaseResult {
  /** ID de la stratégie (= `strategyId`). */
  id: string;
  /** Client strategy id ; `null` si absent. */
  clientId: string | null;
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Sens. */
  side: Side;
  /** Quantité (chaîne décimale). */
  size: string;
  /** Statut de la stratégie (natif, ex. `NEW`). */
  status: string;
  /** Reduce-only. */
  reduceOnly: boolean;
  /** Timestamp (ms, = `updateTime`). */
  time: number;
  /** Champs natifs hors cœur (offsets, `quantityUnit`, `priceLimit`, `bookTime`…). */
  xtras: Record<string, unknown>;
}

/**
 * Ordre **stratégie** (OTO/OCO/OTOCO) au format normalisé Aster. Pas d'équivalent commun
 * (composite multi-legs) → interface dédiée, noms alignés sur le cœur (`id`/`clientId`/
 * `type`/`status`/`time`). Les sous-ordres restent natifs dans `subOrders` (formes composites).
 */
export interface StrategyInfo {
  /** ID de la stratégie (= `strategyId`). */
  id: string;
  /** Client strategy id ; `null` si absent. */
  clientId: string | null;
  /** Type de stratégie (`OTO`/`OCO`/`OTOCO`). */
  type: string;
  /** Statut de la stratégie. */
  status: string;
  /** Timestamp de mise à jour (ms). */
  time: number;
  /** Sous-ordres natifs (composites). */
  subOrders: Record<string, unknown>[];
  /** Champs natifs hors cœur (`bookTime`…). */
  xtras: Record<string, unknown>;
}

/** Convertisseur **unidirectionnel** chase Aster → {@link ChaseResult} (noms cœur). */
export class ChaseConverter {
  toCommon(wire: ChaseOrder): ChaseResult {
    const {
      strategyId,
      clientStrategyId,
      symbol,
      side,
      quantity,
      strategyStatus,
      reduceOnly,
      updateTime,
      ...rest
    } = wire;
    return {
      id: String(strategyId),
      clientId: clientStrategyId === '' ? null : clientStrategyId,
      name: symbol,
      side: (side as string) === 'SELL' ? 'sell' : ('buy' as Side),
      size: quantity,
      status: strategyStatus,
      reduceOnly,
      time: updateTime,
      xtras: rest as Record<string, unknown>,
    };
  }
}

/** Convertisseur **unidirectionnel** stratégie Aster → {@link StrategyInfo} (noms cœur). */
export class StrategyConverter {
  toCommon(wire: StrategyOrder): StrategyInfo {
    const {
      strategyId,
      clientStrategyId,
      strategyType,
      strategyStatus,
      updateTime,
      subOrders,
      ...rest
    } = wire;
    return {
      id: String(strategyId),
      clientId: clientStrategyId === '' ? null : clientStrategyId,
      type: strategyType,
      status: strategyStatus,
      time: updateTime,
      subOrders,
      xtras: rest as Record<string, unknown>,
    };
  }
}
