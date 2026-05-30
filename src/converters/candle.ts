import type { Candle, MarketKind } from '../common/types';

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

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

/**
 * Payload WS `kline` Aster (format Binance) — objet `{ e, E, s, k }`, la bougie est dans `k`.
 * Diffère du natif REST (array 12 colonnes) → converter WS dédié.
 */
export interface KlineWsNative {
  e: string;
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    s: string;
    i: string;
    f: number;
    L: number;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    n: number;
    x: boolean;
    q: string;
    V: string;
    Q: string;
    B: string;
  };
}

/**
 * Convertisseur WS **unidirectionnel** bougie : `toCommon(payload) → Candle`.
 * Lecture seule (pas de `toNative` : on ne renvoie jamais un payload WS au serveur).
 * `qv`=`q`, `tbbv`=`V`, `tbqv`=`Q` ; le hors-cœur (`e/E/f/L/x/B`) va dans `xtras`.
 */
export class CandleWsConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(msg: KlineWsNative): Candle {
    const k = msg.k;
    return {
      t: k.t,
      T: k.T,
      s: k.s,
      i: k.i,
      o: k.o,
      c: k.c,
      h: k.h,
      l: k.l,
      v: k.v,
      n: k.n,
      kind: this.kind,
      qv: k.q,
      tbbv: k.V,
      tbqv: k.Q,
      xtras: { e: msg.e, E: msg.E, f: k.f, L: k.L, x: k.x, B: k.B },
    };
  }
}
