import type { SubAccount } from '../../common/types';
import type { FuturesSubAccount } from '../futures/types';

/** Sous-compte natif Aster (`/fapi/v3/getSubAccountList`). */
export type SubAccountNative = FuturesSubAccount;

/**
 * Convertisseur **bijectif** sous-compte : `toCommon(native) → SubAccount` / inverse.
 * Seule l'`address` est dans le cœur ; le reste (accountId, parentAccount, subAccountName,
 * futureBalanceList) → `xtras` → bijection totale.
 */
export class SubAccountConverter {
  toCommon(wire: SubAccountNative): SubAccount {
    const { address, ...rest } = wire;
    return { address, xtras: rest as Record<string, unknown> };
  }

  toNative(account: SubAccount): SubAccountNative {
    return { address: account.address, ...account.xtras } as unknown as SubAccountNative;
  }
}
