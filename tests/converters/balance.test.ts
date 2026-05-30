import { describe, expect, it } from 'vitest';
import type { Balance } from '../../src/common/types';
import { BalanceConverter, type BalanceNative } from '../../src/converters/balance';

const BALANCE_CORE_KEYS = ['asset', 'available', 'total', 'usdValue'];

const WIRE: BalanceNative = {
  accountAlias: 'abc',
  asset: 'USDT',
  balance: '1000.0',
  crossWalletBalance: '1000.0',
  crossUnPnl: '0.0',
  availableBalance: '950.0',
  maxWithdrawAmount: '950.0',
  marginAvailable: true,
  updateTime: 1_700_000_000_000,
};

describe('BalanceConverter Aster — bijectivité + conformité', () => {
  const conv = new BalanceConverter();

  it('toCommon : total/available extraits, reste dans xtras', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      asset: 'USDT',
      total: '1000.0',
      available: '950.0',
      usdValue: null,
      xtras: {
        accountAlias: 'abc',
        crossWalletBalance: '1000.0',
        crossUnPnl: '0.0',
        maxWithdrawAmount: '950.0',
        marginAvailable: true,
        updateTime: 1_700_000_000_000,
      },
    } satisfies Balance);
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(BALANCE_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
