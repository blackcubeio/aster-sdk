import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { type Hex, KlineInterval } from '../src/common/types';
import { getBookTicker } from '../src/rest/futures/market/get-book-ticker';
import { getExchangeInfo } from '../src/rest/futures/market/get-exchange-info';
import { getKlines } from '../src/rest/futures/market/get-klines';
import { getMarkPrice } from '../src/rest/futures/market/get-mark-price';
import { getOrderBook } from '../src/rest/futures/market/get-order-book';
import { getServerTime } from '../src/rest/futures/market/get-server-time';
import { ping } from '../src/rest/futures/market/ping';

// Lectures market data réelles sur le **testnet** futures (fapi.asterdex-testnet.com),
// non signées. Le label `tn` ne sert qu'à sélectionner le réseau (aucune signature).
const TN = 'tn';

describe('futures market data (testnet réel)', () => {
  beforeAll(() => {
    init({
      signers: {
        [TN]: {
          privateKey: `0x${'11'.repeat(32)}` as Hex,
          user: `0x${'00'.repeat(20)}` as Hex,
          network: 'testnet',
        },
      },
    });
  });

  it('ping répond', async () => {
    await expect(ping(TN)).resolves.toBeUndefined();
  });

  it('getServerTime renvoie un timestamp plausible', async () => {
    const { serverTime } = await getServerTime(TN);
    expect(serverTime).toBeGreaterThan(1_700_000_000_000);
  });

  it('getExchangeInfo liste des symboles avec BTCUSDT', async () => {
    const info = await getExchangeInfo(TN);
    expect(info.timezone).toBe('UTC');
    expect(info.symbols.some((symbol) => symbol.symbol === 'BTCUSDT')).toBe(true);
    expect(info.symbols[0]?.kind).toBe('perp');
  });

  it('getOrderBook renvoie des niveaux décodés {price, qty}', async () => {
    const book = await getOrderBook({ symbol: 'BTCUSDT', limit: 5 }, TN);
    expect(book.bids.length).toBeGreaterThan(0);
    expect(book.asks.length).toBeGreaterThan(0);
    expect(Number(book.bids[0]?.price)).toBeGreaterThan(0);
    expect(Number(book.asks[0]?.qty)).toBeGreaterThanOrEqual(0);
  });

  it('getKlines décode des bougies positionnelles', async () => {
    const candles = await getKlines(
      { symbol: 'BTCUSDT', interval: KlineInterval.OneHour, limit: 3 },
      TN,
    );
    expect(candles).toHaveLength(3);
    expect(candles[0]?.t).toBeGreaterThan(0);
    expect(Number(candles[0]?.c)).toBeGreaterThan(0);
    expect(candles[0]?.s).toBe('BTCUSDT');
    expect(candles[0]?.i).toBe('1h');
    expect(candles[0]?.kind).toBe('perp');
  });

  it('getMarkPrice(symbol) renvoie un objet, sans symbole un tableau', async () => {
    const one = await getMarkPrice('BTCUSDT', TN);
    expect(one.symbol).toBe('BTCUSDT');
    expect(Number(one.markPrice)).toBeGreaterThan(0);

    const all = await getMarkPrice(undefined, TN);
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(1);
  });

  it('getBookTicker renvoie le meilleur bid/ask', async () => {
    const ticker = await getBookTicker('BTCUSDT', TN);
    expect(Number(ticker.bidPrice)).toBeGreaterThan(0);
    expect(Number(ticker.askPrice)).toBeGreaterThanOrEqual(Number(ticker.bidPrice));
  });
});
