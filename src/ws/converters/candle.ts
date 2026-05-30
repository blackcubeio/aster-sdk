import type { Candle, MarketKind } from '../../common/types';

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
