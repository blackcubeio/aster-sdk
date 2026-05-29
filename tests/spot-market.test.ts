import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import { type Hex, KlineInterval } from '../src/common/types';
import { getBookTickerSpot } from '../src/rest/spot/market/get-book-ticker';
import { getExchangeInfoSpot } from '../src/rest/spot/market/get-exchange-info';
import { getKlinesSpot } from '../src/rest/spot/market/get-klines';
import { getOrderBookSpot } from '../src/rest/spot/market/get-order-book';
import { getServerTimeSpot } from '../src/rest/spot/market/get-server-time';
import { pingSpot } from '../src/rest/spot/market/ping';

// Lectures market data spot réelles sur le testnet (sapi.asterdex-testnet.com), non signées.
const TN = 'tn';
const SYMBOL = 'ASTERUSDT';

describe('spot market data (testnet réel)', () => {
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

  it('pingSpot répond', async () => {
    await expect(pingSpot(TN)).resolves.toBeUndefined();
  });

  it('getServerTimeSpot renvoie un timestamp plausible', async () => {
    const { serverTime } = await getServerTimeSpot(TN);
    expect(serverTime).toBeGreaterThan(1_700_000_000_000);
  });

  it('getExchangeInfoSpot liste des symboles', async () => {
    const info = await getExchangeInfoSpot(TN);
    expect(info.timezone).toBe('UTC');
    expect(info.symbols.length).toBeGreaterThan(0);
    expect(info.symbols[0]?.kind).toBe('spot');
  });

  it('getOrderBookSpot décode les niveaux', async () => {
    const book = await getOrderBookSpot({ symbol: SYMBOL, limit: 5 }, TN);
    expect(book.bids.length).toBeGreaterThan(0);
    expect(Number(book.asks[0]?.price)).toBeGreaterThan(0);
  });

  it('getKlinesSpot décode des bougies (11 colonnes)', async () => {
    const candles = await getKlinesSpot(
      { symbol: SYMBOL, interval: KlineInterval.OneHour, limit: 3 },
      TN,
    );
    expect(candles).toHaveLength(3);
    expect(Number(candles[0]?.c)).toBeGreaterThan(0);
    expect(candles[0]?.s).toBe(SYMBOL);
    expect(candles[0]?.i).toBe('1h');
    expect(candles[0]?.kind).toBe('spot');
  });

  it('getBookTickerSpot renvoie le meilleur bid/ask', async () => {
    const ticker = await getBookTickerSpot(SYMBOL, TN);
    expect(Number(ticker.bidPrice)).toBeGreaterThan(0);
    expect(Number(ticker.askPrice)).toBeGreaterThanOrEqual(Number(ticker.bidPrice));
  });
});
