import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { KlineInterval } from '../src/common/types';
import { getBookTicker } from '../src/rest/futures/market/get-book-ticker';
import { getExchangeInfo } from '../src/rest/futures/market/get-exchange-info';
import { getKlines } from '../src/rest/futures/market/get-klines';
import { getMarkPrice } from '../src/rest/futures/market/get-mark-price';
import { getOrderBook } from '../src/rest/futures/market/get-order-book';
import { getServerTime } from '../src/rest/futures/market/get-server-time';
import { ping } from '../src/rest/futures/market/ping';

// Lectures market data réelles sur le mainnet futures (fapi.asterdex.com), non signées.
describe('futures market data (mainnet réel)', () => {
  beforeAll(() => {
    init();
  });

  it('ping répond', async () => {
    await expect(ping()).resolves.toBeUndefined();
  });

  it('getServerTime renvoie un timestamp plausible', async () => {
    const { serverTime } = await getServerTime();
    expect(serverTime).toBeGreaterThan(1_700_000_000_000);
  });

  it('getExchangeInfo liste des symboles avec BTCUSDT', async () => {
    const info = await getExchangeInfo();
    expect(info.timezone).toBe('UTC');
    expect(info.symbols.some((symbol) => symbol.symbol === 'BTCUSDT')).toBe(true);
  });

  it('getOrderBook renvoie des niveaux décodés {price, qty}', async () => {
    const book = await getOrderBook({ symbol: 'BTCUSDT', limit: 5 });
    expect(book.bids.length).toBeGreaterThan(0);
    expect(book.asks.length).toBeGreaterThan(0);
    expect(Number(book.bids[0]?.price)).toBeGreaterThan(0);
    expect(Number(book.asks[0]?.qty)).toBeGreaterThanOrEqual(0);
  });

  it('getKlines décode des bougies positionnelles', async () => {
    const candles = await getKlines({
      symbol: 'BTCUSDT',
      interval: KlineInterval.OneHour,
      limit: 3,
    });
    expect(candles).toHaveLength(3);
    expect(candles[0]?.openTime).toBeGreaterThan(0);
    expect(Number(candles[0]?.close)).toBeGreaterThan(0);
  });

  it('getMarkPrice(symbol) renvoie un objet, sans symbole un tableau', async () => {
    const one = await getMarkPrice('BTCUSDT');
    expect(one.symbol).toBe('BTCUSDT');
    expect(Number(one.markPrice)).toBeGreaterThan(0);

    const all = await getMarkPrice();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(1);
  });

  it('getBookTicker renvoie le meilleur bid/ask', async () => {
    const ticker = await getBookTicker('BTCUSDT');
    expect(Number(ticker.bidPrice)).toBeGreaterThan(0);
    expect(Number(ticker.askPrice)).toBeGreaterThanOrEqual(Number(ticker.bidPrice));
  });
});
