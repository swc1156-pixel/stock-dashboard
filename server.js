const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const toNumber = (v, def = null) => {
  if (v === undefined || v === null) return def;
  const n = Number(v);
  return Number.isNaN(n) ? def : n;
};

app.get('/api/quote/:symbol', async (req, res) => {
  const symbol = req.params.symbol;

  try {
    const quote = await yahooFinance.quote(symbol);

    const price = toNumber(quote.price);
    const prevClose = toNumber(quote.previousClose);
    const change = price !== null && prevClose !== null ? price - prevClose : null;
    const changePct =
      price !== null && prevClose
        ? (change / prevClose) * 100
        : toNumber(quote.regularMarketChangePercent);

    const hi52w = toNumber(quote['52WeekHigh']);
    const sector = quote.sector || quote.industry || 'N/A';

    const fin = quote; // yahoo-finance 0.3.8 returns mixed fundamentals on quote

    const financials = {
      revenue: fin.revenue || '-',
      operatingIncome: fin.operatingMargin || '-',
      eps: fin.eps || '-',
      per: fin.pe || '-',
      pbr: fin.priceToBook || '-',
      roe: fin.roe || '-'
    };

    res.json({
      symbol,
      name: quote.name || symbol,
      sector,
      price,
      change,
      changePct,
      high52w: hi52w,
      currency: quote.currency || 'USD',
      financials
    });
  } catch (err) {
    console.error('quote error', err);
    res.status(500).json({ error: 'Failed to fetch quote', details: String(err) });
  }
});

app.get('/api/chart/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const { interval = '1d', period1, period2 } = req.query;

  try {
    const from = period1 || '2024-01-01';
    const to = period2 || new Date().toISOString().slice(0, 10);

    const result = await yahooFinance.historical({
      symbol,
      from,
      to,
      period: interval
    });

    const data = (result || [])
      .map((q) => ({
        date: q.date?.toISOString?.().slice(0, 10) || '',
        open: toNumber(q.open),
        high: toNumber(q.high),
        low: toNumber(q.low),
        close: toNumber(q.close),
        volume: toNumber(q.volume)
      }))
      .filter((d) => d.date && d.close !== null);

    res.json({ symbol, interval, data });
  } catch (err) {
    console.error('chart error', err);
    res.status(500).json({ error: 'Failed to fetch chart', details: String(err) });
  }
});

app.get('/api/search/:query', async (req, res) => {
  const query = req.params.query;
  if (!query || query.length < 1) {
    return res.json({ results: [] });
  }

  try {
    const results = await yahooFinance.search(query);

    const mapped = (results || [])
      .filter((q) => q.symbol)
      .map((q) => ({
        symbol: q.symbol,
        name: q.name || q.symbol,
        exchange: q.stockExchange || '',
        sector: q.sector || ''
      }));

    res.json({ results: mapped });
  } catch (err) {
    console.error('search error', err);
    res.status(500).json({ error: 'Failed to search symbols', details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

