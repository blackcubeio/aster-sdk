import type { FundingRate } from '../common/types';

/** Point de funding natif Aster (`/fapi/v3/fundingRate`). */
export interface FundingRateNative {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
}

/**
 * Convertisseur **bijectif** funding : `toCommon(native) → FundingRate` / inverse.
 * Aster fournit tout le cœur (pas d'`xtras`) → bijection totale.
 */
export class FundingConverter {
  toCommon(wire: FundingRateNative): FundingRate {
    return { name: wire.symbol, fundingRate: wire.fundingRate, time: wire.fundingTime };
  }

  toNative(funding: FundingRate): FundingRateNative {
    return { symbol: funding.name, fundingRate: funding.fundingRate, fundingTime: funding.time };
  }
}
