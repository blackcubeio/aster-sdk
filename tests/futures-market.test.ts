import { beforeAll, describe, expect, it } from 'vitest';
import { type Hex, KlineInterval } from '../src/common/types';
import { Aster } from '../src/dex/aster';

// Lectures market data réelles sur le **testnet** futures (fapi.asterdex-testnet.com),
// non signées. Le signer `tn` ne sert qu'à sélectionner le réseau (aucune signature).
let dex: Aster;

describe('futures market data (testnet réel) — via façade', () => {
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

  it('system().ping répond', async () => {
    await expect(dex.system().ping()).resolves.toBeUndefined();
  });

  it('system().getServerTime renvoie un timestamp plausible', async () => {
    const serverTime = await dex.system().getServerTime();
    expect(serverTime).toBeGreaterThan(1_700_000_000_000);
  });

  it('perp().getExchangeInfo liste des symboles avec BTCUSDT', async () => {
    const info = (await dex.perp().getExchangeInfo()) as {
      timezone: string;
      symbols: { symbol: string; kind: string }[];
    };
    expect(info.timezone).toBe('UTC');
    expect(info.symbols.some((symbol) => symbol.symbol === 'BTCUSDT')).toBe(true);
    expect(info.symbols[0]?.kind).toBe('perp');
  });

  it('perp().getOrderBook renvoie le carnet unifié {price, size, n}', async () => {
    const book = await dex.perp().getOrderBook({ name: 'BTCUSDT', limit: 5 });
    expect(book.name).toBe('BTCUSDT');
    expect(book.kind).toBe('perp');
    expect(book.bids.length).toBeGreaterThan(0);
    expect(book.asks.length).toBeGreaterThan(0);
    expect(Number(book.bids[0]?.price)).toBeGreaterThan(0);
    expect(Number(book.asks[0]?.size)).toBeGreaterThanOrEqual(0);
    expect(book.bids[0]?.n).toBeNull();
  });

  it('perp().getPairs renvoie le format unifié perp uniquement (scope)', async () => {
    const pairs = await dex.perp().getPairs();
    expect(pairs.length).toBeGreaterThan(0);
    const btc = pairs.find((p) => p.base === 'BTC' && p.kind === 'perp');
    expect(btc?.name).toBe('BTCUSDT');
    expect(btc?.quote).toBe('USDT');
    expect(typeof btc?.szDecimals).toBe('number');
    expect(typeof btc?.tickSize).toBe('string');
    expect(typeof btc?.xtras).toBe('object');
    // Le scope perp() ne renvoie que des paires perp.
    expect(pairs.every((p) => p.kind === 'perp')).toBe(true);
  });

  it('perp().getCandles décode des bougies positionnelles', async () => {
    const candles = await dex
      .perp()
      .getCandles({ name: 'BTCUSDT', interval: KlineInterval.OneHour, limit: 3 });
    expect(candles).toHaveLength(3);
    expect(candles[0]?.t).toBeGreaterThan(0);
    expect(Number(candles[0]?.c)).toBeGreaterThan(0);
    expect(candles[0]?.s).toBe('BTCUSDT');
    expect(candles[0]?.i).toBe('1h');
    expect(candles[0]?.kind).toBe('perp');
  });

  it('perp().getPrices renvoie les prix unifiés (mark/oracle/funding)', async () => {
    const prices = await dex.perp().getPrices();
    expect(prices.length).toBeGreaterThan(1);
    const btc = prices.find((p) => p.name === 'BTCUSDT');
    expect(btc?.kind).toBe('perp');
    expect(Number(btc?.mark)).toBeGreaterThan(0);
    expect(Number(btc?.oracle)).toBeGreaterThan(0);
    expect(btc?.mid).toBeNull();
    expect(Number(btc?.bid)).toBeGreaterThan(0);
    expect(Number(btc?.ask)).toBeGreaterThanOrEqual(Number(btc?.bid));
    expect(Number(btc?.last)).toBeGreaterThan(0);
    expect(typeof btc?.xtras?.interestRate).toBe('string');
  });

  it('perp().getTrades renvoie des trades unifiés (side taker, maker null)', async () => {
    const trades = await dex.perp().getTrades({ name: 'BTCUSDT', limit: 5 });
    expect(trades.length).toBeGreaterThan(0);
    const trade = trades[0];
    expect(Number(trade?.price)).toBeGreaterThan(0);
    expect(['buy', 'sell']).toContain(trade?.side);
    expect(trade?.maker).toBeNull();
    expect(typeof trade?.id).toBe('number');
  });
});
