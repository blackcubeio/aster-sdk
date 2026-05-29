import type { Candle, MarketKind } from '../../common/types';

/**
 * Ligne de bougie positionnelle Aster — **wire complet, 12 colonnes**.
 * Toutes les colonnes sont préservées (les non-standard atterrissent dans `Candle.xtras`).
 */
export type CandleNative = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

/**
 * Convertisseur **bijectif total** bougie : `toCommon(native) → Candle` / `toNative(Candle) → native`.
 * Le contexte `s`/`i`/`kind` (absent du wire Aster) est porté par le convertisseur.
 * Invariant : `toNative(toCommon(row)) ≡ row` et `toCommon(toNative(c)) ≡ c` — **aucun champ jeté**
 * (les colonnes non standard, `ignore` comprise, vivent dans `xtras`).
 */
export class CandleConverter {
  constructor(
    private readonly s: string,
    private readonly i: string,
    private readonly kind: MarketKind,
  ) {}

  toCommon(row: CandleNative): Candle {
    return {
      t: row[0],
      T: row[6],
      s: this.s,
      i: this.i,
      o: row[1],
      c: row[4],
      h: row[2],
      l: row[3],
      v: row[5],
      n: row[8],
      kind: this.kind,
      qv: row[7],
      tbbv: row[9],
      tbqv: row[10],
      xtras: { ignore: row[11] },
    };
  }

  toNative(candle: Candle): CandleNative {
    return [
      candle.t,
      candle.o,
      candle.h,
      candle.l,
      candle.c,
      candle.v,
      candle.T,
      candle.qv as string,
      candle.n,
      candle.tbbv as string,
      candle.tbqv as string,
      candle.xtras?.ignore as string,
    ];
  }
}
