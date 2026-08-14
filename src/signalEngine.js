import { RSI, EMA, MACD } from 'technicalindicators';

async function getTF(interval, symbol = 'BTCUSDT') {
const res = await fetch(
  `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=250`
);

const candles = await res.json();

const closes = candles.map(c => Number(c[4]));
const highs = candles.map(c => Number(c[2]));
const lows = candles.map(c => Number(c[3]));

const rsi = RSI.calculate({ values: closes, period: 14 });
const ema20 = EMA.calculate({ values: closes, period: 20 });
const ema50 = EMA.calculate({ values: closes, period: 50 });
const ema200 = EMA.calculate({ values: closes, period: 200 });

const macd = MACD.calculate({
values: closes,
fastPeriod: 12,
slowPeriod: 26,
signalPeriod: 9,
SimpleMAOscillator: false,
SimpleMASignal: false,
});

const lastRsi = rsi[rsi.length - 1];
const lastE20 = ema20[ema20.length - 1];
const lastE50 = ema50[ema50.length - 1];
const lastE200 = ema200[ema200.length - 1];
const lastMacd = macd[macd.length - 1];
const lastClose = closes[closes.length - 1];
const last = candles[candles.length - 1];
const prev = candles[candles.length - 2];

const open = Number(last[1]);
const high = Number(last[2]);
const low = Number(last[3]);
const close = Number(last[4]);

const prevOpen = Number(prev[1]);
const prevClose = Number(prev[4]);

const body = Math.abs(close - open);
const upperWick = high - Math.max(open, close);
const lowerWick = Math.min(open, close) - low;

let pattern = 'None';

// Doji
if (body <= (high - low) * 0.1) {
  pattern = 'Doji';
}

// Hammer
if (
  lowerWick > body * 2 &&
  upperWick < body &&
  close > open
) {
  pattern = 'Hammer';
}

// Shooting Star
if (
  upperWick > body * 2 &&
  lowerWick < body &&
  close < open
) {
  pattern = 'Shooting Star';
}

// Bullish Engulfing
if (
  prevClose < prevOpen &&
  close > open &&
  open <= prevClose &&
  close >= prevOpen
) {
  pattern = 'Bullish Engulfing';
}

// Bearish Engulfing
if (
  prevClose > prevOpen &&
  close < open &&
  open >= prevClose &&
  close <= prevOpen
) {
  pattern = 'Bearish Engulfing';
}
const bullish =
lastClose > lastE20 &&
lastE20 > lastE50 &&
lastE50 > lastE200 &&
lastMacd.MACD > lastMacd.signal &&
lastRsi >= 58;

const bearish =
lastClose < lastE20 &&
lastE20 < lastE50 &&
lastE50 < lastE200 &&
lastMacd.MACD < lastMacd.signal &&
lastRsi <= 42;

let signal = 'HOLD';

if (bullish) signal = 'BUY';
else if (bearish) signal = 'SELL';

return {
signal,
price: lastClose,
rsi: lastRsi,
ema20: lastE20,
ema50: lastE50,
ema200: lastE200,
macd: lastMacd.MACD,
macdBullish: lastMacd.MACD > lastMacd.signal,
support: Math.min(...lows.slice(-20)),
resistance: Math.max(...highs.slice(-20)),
pattern,
};
}

export async function generateSignal(
  timeframe = '1h',
  symbol = 'BTCUSDT'
) {
const current = await getTF(timeframe, symbol);

const tf15 = await getTF('15m', symbol);
const tf1h = await getTF('1h', symbol);
const tf4h = await getTF('4h', symbol);

let buyVotes =
  (tf15.signal === 'BUY' || tf15.signal === 'STRONG BUY' ? 1 : 0) +
  (tf1h.signal === 'BUY' || tf1h.signal === 'STRONG BUY' ? 1 : 0) +
  (tf4h.signal === 'BUY' || tf4h.signal === 'STRONG BUY' ? 1 : 0);

let sellVotes =
  (tf15.signal === 'SELL' || tf15.signal === 'STRONG SELL' ? 1 : 0) +
  (tf1h.signal === 'SELL' || tf1h.signal === 'STRONG SELL' ? 1 : 0) +
  (tf4h.signal === 'SELL' || tf4h.signal === 'STRONG SELL' ? 1 : 0);

const emaBullish =
  current.ema20 > current.ema50 && current.ema50 > current.ema200;

const emaBearish =
  current.ema20 < current.ema50 && current.ema50 < current.ema200;

const breakout = current.price > current.resistance * 0.999;
const breakdown = current.price < current.support * 1.001;


let score = 50;

// 4h highest weight
if (tf4h.signal === 'BUY') score += 20;
if (tf4h.signal === 'SELL') score -= 20;

// 1h medium weight
if (tf1h.signal === 'BUY') score += 15;
if (tf1h.signal === 'SELL') score -= 15;

// 15m lower weight
if (tf15.signal === 'BUY') score += 10;
if (tf15.signal === 'SELL') score -= 10;

// RSI
if (current.rsi >= 60) score += 5;
if (current.rsi <= 40) score -= 5;

// MACD
if (current.macdBullish) score += 10;
else score -= 10;

score = Math.max(0, Math.min(100, Math.round(score)));

let signal = 'HOLD';

if (buyVotes >= 3 && emaBullish && current.rsi >= 55 && current.macdBullish && breakout) {
  signal = 'STRONG BUY';
  score = Math.max(score, 88);
} else if (buyVotes >= 2 && emaBullish && current.macdBullish) {
  signal = 'BUY';
  score = Math.max(score, 72);
} else if (sellVotes >= 3 && emaBearish && current.rsi <= 45 && !current.macdBullish && breakdown) {
  signal = 'STRONG SELL';
  score = Math.max(score, 88);
} else if (sellVotes >= 2 && emaBearish && !current.macdBullish) {
  signal = 'SELL';
  score = Math.max(score, 72);
} else {
  signal = 'HOLD';
  score = Math.min(score, 55);
}

let trendStrength = 'Sideways';

if (signal === 'STRONG BUY') trendStrength = 'Strong Bullish';
else if (signal === 'BUY') trendStrength = 'Bullish';
else if (signal === 'STRONG SELL') trendStrength = 'Strong Bearish';
else if (signal === 'SELL') trendStrength = 'Bearish';
else trendStrength = 'Sideways';

const atrApprox = Math.max(
  current.price * 0.0035,
  (current.resistance - current.support) * 0.35
);

let target;
let stopLoss;
let takeProfit1;
let takeProfit2;

if (signal === 'BUY' || signal === 'STRONG BUY') {
  stopLoss = Math.min(
    current.support - atrApprox * 0.5,
    current.price - atrApprox
  );

  takeProfit1 = current.price + atrApprox * 1.2;
  takeProfit2 = Math.max(
    current.resistance + atrApprox,
    current.price + atrApprox * 2.2
  );

  target = takeProfit2;
} else if (signal === 'SELL' || signal === 'STRONG SELL') {
  stopLoss = Math.max(
    current.resistance + atrApprox * 0.5,
    current.price + atrApprox
  );

  takeProfit1 = current.price - atrApprox * 1.2;
  takeProfit2 = Math.min(
    current.support - atrApprox,
    current.price - atrApprox * 2.2
  );

  target = takeProfit2;
} else {
  stopLoss = current.price - atrApprox;
  takeProfit1 = current.price + atrApprox * 0.5;
  takeProfit2 = current.price + atrApprox;
  target = takeProfit2;
}

return {
signal,
confidence: score,
trendStrength,
lastUpdated: new Date().toLocaleTimeString(),

price: current.price,
rsi: current.rsi,
ema20: current.ema20,
ema50: current.ema50,
ema200: current.ema200,
macd: current.macd,
macdBullish: current.macdBullish,

support: current.support,
resistance: current.resistance,

entry: current.price,
target,
stopLoss,
takeProfit1,
takeProfit2,

tf15m: tf15.signal,
tf1h: tf1h.signal,
tf4h: tf4h.signal,
pattern: current.pattern,

};
}
