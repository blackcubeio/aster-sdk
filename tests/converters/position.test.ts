import { describe, expect, it } from 'vitest';
import type { Position } from '../../src/common/types';
import { PositionConverter, type PositionNative } from '../../src/rest/converters/position';

const POSITION_CORE_KEYS = [
  'entryPrice',
  'leverage',
  'liquidationPrice',
  'margin',
  'markPrice',
  'name',
  'side',
  'size',
  'unrealizedPnl',
];

const WIRE = {
  symbol: 'BTCUSDT',
  positionSide: 'BOTH',
  positionAmt: '-0.5',
  entryPrice: '74000.0',
  markPrice: '74010.0',
  unRealizedProfit: '-5.0',
  liquidationPrice: '90000.0',
  leverage: '20',
  maxNotionalValue: '1000000',
  marginType: 'cross',
  isolatedMargin: '0.0',
  isAutoAddMargin: 'false',
  updateTime: 1_700_000_000_000,
} as unknown as PositionNative;

describe('PositionConverter Aster — bijectivité + conformité', () => {
  const conv = new PositionConverter();

  it('toCommon : side/size dérivés du positionAmt signé, reste dans xtras', () => {
    const pos = conv.toCommon(WIRE);
    expect(pos.name).toBe('BTCUSDT');
    expect(pos.side).toBe('short');
    expect(pos.size).toBe('0.5');
    expect(pos.leverage).toBe(20);
    expect(pos.margin).toBe('0.0');
    expect(pos.xtras?.positionAmt).toBe('-0.5');
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(POSITION_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
