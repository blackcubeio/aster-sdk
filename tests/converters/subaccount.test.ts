import { describe, expect, it } from 'vitest';
import type { SubAccount } from '../../src/common/types';
import { SubAccountConverter, type SubAccountNative } from '../../src/converters/subaccount';

const SUBACCOUNT_CORE_KEYS = ['address'];

const WIRE: SubAccountNative = {
  address: '0xabc0000000000000000000000000000000000001',
  accountId: 42,
  parentAccount: true,
  subAccountName: 'desk-1',
  futureBalanceList: [{ asset: 'USDT', balance: '1000.0' }],
};

describe('SubAccountConverter Aster — bijectivité + conformité', () => {
  const conv = new SubAccountConverter();

  it('toCommon : address extraite, reste dans xtras', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      address: '0xabc0000000000000000000000000000000000001',
      xtras: {
        accountId: 42,
        parentAccount: true,
        subAccountName: 'desk-1',
        futureBalanceList: [{ asset: 'USDT', balance: '1000.0' }],
      },
    } satisfies SubAccount);
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(SUBACCOUNT_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
