import { beforeAll, describe, expect, it } from 'vitest';
import { type Hex, KlineInterval } from '../src/common/types';
import { Aster } from '../src/dex/aster';

// Lectures market data spot réelles sur le testnet (sapi.asterdex-testnet.com), non signées.
const SYMBOL = 'ASTERUSDT';
let dex: Aster;

describe('spot market data (testnet réel) — via façade', () => {
  beforeAll(() => {
    dex = new Aster(
      {
        tn: {
          privateKey: `0x${'11'.repeat(32)}` as Hex,
          user: `0x${'00'.repeat(20)}` as Hex,
          network: 'testnet',
        },
      },
      { default: 'tn' },
    );
  });

  it('system().ping répond (spot via le même hôte de connectivité)', async () => {
    await expect(dex.system().ping()).resolves.toBeUndefined();
  });

  it('spot().getExchangeInfo liste des symboles spot', async () => {
    const info = (await dex.spot().getExchangeInfo()) as {
      timezone: string;
      symbols: { kind: string }[];
    };
    expect(info.timezone).toBe('UTC');
    expect(info.symbols.length).toBeGreaterThan(0);
    expect(info.symbols[0]?.kind).toBe('spot');
  });

  it('spot().getOrderBook renvoie le carnet unifié', async () => {
    const book = await dex.spot().getOrderBook({ name: SYMBOL, limit: 5 });
    expect(book.name).toBe(SYMBOL);
    expect(book.kind).toBe('spot');
    expect(book.bids.length).toBeGreaterThan(0);
    expect(Number(book.asks[0]?.price)).toBeGreaterThan(0);
    expect(book.asks[0]?.n).toBeNull();
  });

  it('spot().getCandles décode des bougies', async () => {
    const candles = await dex
      .spot()
      .getCandles({ name: SYMBOL, interval: KlineInterval.OneHour, limit: 3 });
    expect(candles).toHaveLength(3);
    expect(Number(candles[0]?.c)).toBeGreaterThan(0);
    expect(candles[0]?.s).toBe(SYMBOL);
    expect(candles[0]?.i).toBe('1h');
    expect(candles[0]?.kind).toBe('spot');
  });
});
