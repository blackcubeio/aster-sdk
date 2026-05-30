import type { Balance } from '../common/types';
import type { FuturesBalance } from '../rest/futures/types';

/** Solde natif Aster (`/fapi/v3/balance`). */
export type BalanceNative = FuturesBalance;

/**
 * Convertisseur **bijectif** solde : `toCommon(native) → Balance` / inverse.
 * `total = balance`, `available = availableBalance` ; le reste (crossWallet, uPnl, maxWithdraw,
 * marginAvailable, accountAlias, updateTime) → `xtras` → bijection totale.
 */
export class BalanceConverter {
  toCommon(wire: BalanceNative): Balance {
    const { asset, balance, availableBalance, ...rest } = wire;
    return {
      asset,
      total: balance,
      available: availableBalance,
      usdValue: null,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(balance: Balance): BalanceNative {
    return {
      asset: balance.asset,
      balance: balance.total,
      availableBalance: balance.available as string,
      ...balance.xtras,
    } as unknown as BalanceNative;
  }
}
