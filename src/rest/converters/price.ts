import type { Price } from '../../common/types';

/** Snapshot natif Aster (`/fapi/v3/premiumIndex`). */
export interface PriceNative {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

/**
 * Convertisseur **bijectif** prix : `toCommon(native) → Price` / `toNative(price) → native`.
 * Aster = perp (markPrice). `mark`/`oracle(=index)`/`funding`/`time` mappés ; `mid`/`openInterest`/
 * `volume24h`/`prevDayPrice` absents de ce endpoint (`null`). estimatedSettle/nextFundingTime/
 * interestRate → `xtras` → bijection totale.
 */
export class PriceConverter {
  toCommon(wire: PriceNative): Price {
    return {
      name: wire.symbol,
      kind: 'perp',
      mark: wire.markPrice,
      oracle: wire.indexPrice,
      mid: null,
      funding: wire.lastFundingRate,
      openInterest: null,
      volume24h: null,
      prevDayPrice: null,
      time: wire.time,
      xtras: {
        estimatedSettlePrice: wire.estimatedSettlePrice,
        nextFundingTime: wire.nextFundingTime,
        interestRate: wire.interestRate,
      },
    };
  }

  toNative(price: Price): PriceNative {
    const xtras = price.xtras ?? {};
    return {
      symbol: price.name,
      markPrice: price.mark as string,
      indexPrice: price.oracle as string,
      estimatedSettlePrice: xtras.estimatedSettlePrice as string,
      lastFundingRate: price.funding as string,
      nextFundingTime: xtras.nextFundingTime as number,
      interestRate: xtras.interestRate as string,
      time: price.time as number,
    };
  }
}
