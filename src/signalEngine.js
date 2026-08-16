import { RSI, EMA, MACD } from 'technicalindicators';

async function getTF(interval) {
const res = await fetch(
`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=250`
);

const candles = await res.json();

if (!Array.isArray(candles)) {
throw new Error('BTCUSDT data not available');
}

const closes = candles.map(c => Number(c[4]));
const highs = candles.map(c => Number(c[2]));
const lows = candles.map(c => Number(c[3]));

// ===== Swing High / Swing Low Detection =====
const recentHighs = highs.slice(-50);
const recentLows = lows.slice(-50);

const swingHigh = Math.max(...recentHighs);
const swingLow = Math.min(...recentLows);

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

// ===== Liquidity Sweep Detection =====
const recentHigh = Math.max(...highs.slice(-10, -1));
const recentLow = Math.min(...lows.slice(-10, -1));

const liquiditySweepSell = high > recentHigh && close < recentHigh;
const liquiditySweepBuy = low < recentLow && close > recentLow;

const prevOpen = Number(prev[1]);
const prevClose = Number(prev[4]);

const body = Math.abs(close - open);
const upperWick = high - Math.max(open, close);
const lowerWick = Math.min(open, close) - low;

let pattern = 'None';

if (body <= (high - low) * 0.1) pattern = 'Doji';
if (lowerWick > body * 2 && upperWick < body && close > open)
pattern = 'Hammer';
if (upperWick > body * 2 && lowerWick < body && close < open)
pattern = 'Shooting Star';

if (
prevClose < prevOpen &&
close > open &&
open <= prevClose &&
close >= prevOpen
)
pattern = 'Bullish Engulfing';

if (
prevClose > prevOpen &&
close < open &&
open >= prevClose &&
close <= prevOpen
)
pattern = 'Bearish Engulfing';

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
swingHigh,
swingLow,
pattern,
liquiditySweepBuy,
liquiditySweepSell,
};
}

export async function generateSignal(timeframe = '1h') {
const current = await getTF(timeframe);

const tf15 = await getTF('15m');
const tf1h = await getTF('1h');
const tf4h = await getTF('4h');

let buyVotes =
(tf15.signal === 'BUY' ? 1 : 0) +
(tf1h.signal === 'BUY' ? 1 : 0) +
(tf4h.signal === 'BUY' ? 1 : 0);

let sellVotes =
(tf15.signal === 'SELL' ? 1 : 0) +
(tf1h.signal === 'SELL' ? 1 : 0) +
(tf4h.signal === 'SELL' ? 1 : 0);

const emaBullish =
current.ema20 > current.ema50 && current.ema50 > current.ema200;

const emaBearish =
current.ema20 < current.ema50 && current.ema50 < current.ema200;

const breakout = current.price > current.resistance * 0.999;
const breakdown = current.price < current.support * 1.001;

let score = 50;

if (tf4h.signal === 'BUY') score += 20;
if (tf4h.signal === 'SELL') score -= 20;
if (tf1h.signal === 'BUY') score += 15;
if (tf1h.signal === 'SELL') score -= 15;
if (tf15.signal === 'BUY') score += 10;
if (tf15.signal === 'SELL') score -= 10;
if (current.rsi >= 60) score += 5;
if (current.rsi <= 40) score -= 5;
if (current.macdBullish) score += 10;
else score -= 10;

score = Math.max(0, Math.min(100, Math.round(score)));

let signal = 'HOLD';

if (
buyVotes >= 3 &&
emaBullish &&
current.rsi >= 55 &&
current.macdBullish &&
(current.liquiditySweepBuy || breakout)
) {
signal = 'STRONG BUY';
score = Math.max(score, 88);
} else if (buyVotes >= 2 && emaBullish && current.macdBullish) {
signal = 'BUY';
score = Math.max(score, 72);
} else if (
sellVotes >= 3 &&
emaBearish &&
current.rsi <= 45 &&
!current.macdBullish &&
(current.liquiditySweepSell || breakdown)
) {
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
// ===== Trading Session Filter =====
const now = new Date();
const utcHour = now.getUTCHours();

// London: 07-16 UTC
// New York: 12-21 UTC
const isLondon = utcHour >= 7 && utcHour <= 16;
const isNewYork = utcHour >= 12 && utcHour <= 21;
const isActiveSession = isLondon || isNewYork;

// Outside major sessions → avoid aggressive trades
if (
  !isActiveSession &&
  (signal === 'BUY' ||
    signal === 'SELL' ||
    signal === 'STRONG BUY' ||
    signal === 'STRONG SELL')
) {
  signal = 'HOLD';
  score = Math.min(score, 55);
}
const atrApprox = Math.max(
current.price * 0.0035,
(current.resistance - current.support) * 0.35
);

// ===== Professional Pullback Entry (Improved) =====
let bestEntry = current.price;
let entryZoneLow = current.price;
let entryZoneHigh = current.price;

if (signal === 'BUY' || signal === 'STRONG BUY') {
  // Buy near EMA20 / support retest
  bestEntry = Math.max(
    current.support + atrApprox * 0.15,
    current.ema20 - atrApprox * 0.10
  );

  entryZoneLow = bestEntry - atrApprox * 0.10;
  entryZoneHigh = bestEntry + atrApprox * 0.10;

} else if (signal === 'SELL' || signal === 'STRONG SELL') {
  // Sell near EMA20 / resistance retest
  bestEntry = Math.min(
    current.resistance - atrApprox * 0.15,
    current.ema20 + atrApprox * 0.10
  );

  entryZoneLow = bestEntry - atrApprox * 0.10;
  entryZoneHigh = bestEntry + atrApprox * 0.10;

} else {
  // HOLD = midpoint of the current range
  bestEntry = (current.support + current.resistance) / 2;

  entryZoneLow = bestEntry - atrApprox * 0.08;
  entryZoneHigh = bestEntry + atrApprox * 0.08;
}

let target;
let stopLoss;
let takeProfit1;
let takeProfit2;

// ===== Trade Setup (Intraday Tight SL/TP) =====

if (signal === 'BUY' || signal === 'STRONG BUY') {

  // BUY setup
  stopLoss = bestEntry - current.price * 0.003;      // 0.30%
  takeProfit1 = bestEntry + current.price * 0.005;   // 0.50%
  takeProfit2 = bestEntry + current.price * 0.009;   // 0.90%
  target = takeProfit2;


} else if (signal === 'SELL' || signal === 'STRONG SELL') {

  // SELL setup
  stopLoss = bestEntry + current.price * 0.003;      // 0.30%
  takeProfit1 = bestEntry - current.price * 0.005;   // 0.50%
  takeProfit2 = bestEntry - current.price * 0.009;   // 0.90%
  target = takeProfit2;


} else {

  // ===== HOLD = Range Trade Setup =====

  const rangeHigh = current.resistance;
  const rangeLow = current.support;
  const rangeSize = rangeHigh - rangeLow;
  const rangeMid = (rangeHigh + rangeLow) / 2;

  // Price range ke lower half mein hai
  if (current.price <= rangeMid) {

    // Support ke thoda upar entry
    bestEntry = rangeLow + rangeSize * 0.15;

    // Support ke neeche tight SL
    stopLoss = rangeLow - rangeSize * 0.08;

    // Range midpoint = TP1
    takeProfit1 = rangeMid;

    // Resistance ke paas = TP2
    takeProfit2 = rangeHigh - rangeSize * 0.05;

  } else {

    // Price range ke upper half mein hai

    // Resistance ke thoda neeche entry
    bestEntry = rangeHigh - rangeSize * 0.15;

    // Resistance ke upar tight SL
    stopLoss = rangeHigh + rangeSize * 0.08;

    // Range midpoint = TP1
    takeProfit1 = rangeMid;

    // Support ke paas = TP2
    takeProfit2 = rangeLow + rangeSize * 0.05;
  }

  target = takeProfit2;

  // ===== HOLD Entry Zone =====
  entryZoneLow = bestEntry - rangeSize * 0.05;
  entryZoneHigh = bestEntry + rangeSize * 0.05;
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

entry: bestEntry,
entryZoneLow,
entryZoneHigh,
target,
stopLoss,
takeProfit1,
takeProfit2,

tf15m: tf15.signal,
tf1h: tf1h.signal,
tf4h: tf4h.signal,
pattern: current.pattern,
breakevenAfterTp1: true,
trailingStopAfterTp1: true,
};
}
