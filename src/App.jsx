import { useEffect, useState } from 'react';
import './App.css';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { generateSignal } from './signalEngine';

function App() {
const [selectedTF, setSelectedTF] = useState('1h');

const [price, setPrice] = useState('--');
const [signal, setSignal] = useState('HOLD');
const [confidence, setConfidence] = useState(55);
const [trendStrength, setTrendStrength] = useState('Weak');
const [accountSize, setAccountSize] = useState(1000);
const [riskPercent, setRiskPercent] = useState(1);
const [positionSize, setPositionSize] = useState('--');
const [rsi, setRsi] = useState('--');
const [ema20, setEma20] = useState('--');
const [ema50, setEma50] = useState('--');
const [ema200, setEma200] = useState('--');
const [rrRatio, setRrRatio] = useState('--');
const [macd, setMacd] = useState('--');
const [macdSignal, setMacdSignal] = useState('Neutral');
const [signalQuality, setSignalQuality] = useState('B');
const [support, setSupport] = useState('--');
const [resistance, setResistance] = useState('--');
const [aiReasoning, setAiReasoning] = useState('');
const [keyWarning, setKeyWarning] = useState('');
const [nextAction, setNextAction] = useState('');
const [entry, setEntry] = useState('--');
const [target, setTarget] = useState('--');
const [stopLoss, setStopLoss] = useState('--');
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [tf15m, setTf15m] = useState('HOLD');
const [tf1h, setTf1h] = useState('HOLD');
const [tf4h, setTf4h] = useState('HOLD');
const [tp1, setTp1] = useState('--');
const [tp2, setTp2] = useState('--');
const [candlePattern, setCandlePattern] = useState('None');
const [potentialProfit, setPotentialProfit] = useState('--');
const [potentialLoss, setPotentialLoss] = useState('--');
const [priceChange24h, setPriceChange24h] = useState('0.00');
const [sentiment, setSentiment] = useState('Neutral');
const [marketStatus, setMarketStatus] = useState('Neutral');
const [lastAiUpdate, setLastAiUpdate] = useState('--');
const [volatility, setVolatility] = useState('Low');
const [history, setHistory] = useState([]);

const loadSignal = async (tf = selectedTF) => {
  setIsAnalyzing(true);

await new Promise(resolve => setTimeout(resolve, 1500));
try {
const data = await generateSignal(tf);

  const data15 = await generateSignal('15m');
  const data1h = await generateSignal('1h');
  const data4h = await generateSignal('4h');

  setTf15m(data15.signal);
  setTf1h(data1h.signal);
  setTf4h(data4h.signal);

  setPrice(Number(data.price).toLocaleString());
  setSignal(data.signal);
  setConfidence(data.confidence);
  setTrendStrength(data.trendStrength);

  setRsi(data.rsi.toFixed(2));
  setEma20(data.ema20.toFixed(2));
  setEma50(data.ema50.toFixed(2));
  setEma200(data.ema200.toFixed(2));

  setMacd(data.macd.toFixed(2));
  setMacdSignal(data.macdBullish ? 'Bullish' : 'Bearish');
  setCandlePattern(data.pattern);

  setSupport(data.support.toFixed(0));
  setResistance(data.resistance.toFixed(0));

  setEntry(Number(data.entry).toFixed(0));
  setTarget(data.target === '--' ? '--' : Number(data.target).toFixed(0));
  setStopLoss(data.stopLoss === '--' ? '--' : Number(data.stopLoss).toFixed(0));
setTp1(
  data.takeProfit1 === '--'
    ? '--'
    : Number(data.takeProfit1).toFixed(0)
);

setTp2(
  data.takeProfit2 === '--'
    ? '--'
    : Number(data.takeProfit2).toFixed(0)
);

if (data.stopLoss !== '--') {
  const riskAmount = (accountSize * riskPercent) / 100;
  const stopDistance = Math.abs(Number(data.entry) - Number(data.stopLoss));

  if (stopDistance > 0) {
    const qty = riskAmount / stopDistance;
    setPositionSize(qty.toFixed(4));
  } else {
    setPositionSize('--');
  }
} else {
  setPositionSize('--');
}
if (data.target !== '--' && data.stopLoss !== '--') {
  const reward = Math.abs(Number(data.target) - Number(data.entry));
  const risk = Math.abs(Number(data.entry) - Number(data.stopLoss));

  if (risk > 0) {
    setRrRatio(`1:${(reward / risk).toFixed(2)}`);
  } else {
    setRrRatio('--');
  }
} else {
  setRrRatio('--');
}

let quality = 'C';

if (
  (data.signal === 'STRONG BUY' || data.signal === 'STRONG SELL') &&
  data.confidence >= 85
) {
  quality = 'A+';
} else if (data.confidence >= 75) {
  quality = 'A';
} else if (data.confidence >= 60) {
  quality = 'B';
} else {
  quality = 'C';
}
if (
  data.takeProfit2 !== '--' &&
  data.stopLoss !== '--' &&
  positionSize !== '--'
) {
  const qty = Number(positionSize);

  const profit =
    Math.abs(Number(data.takeProfit2) - Number(data.entry)) * qty;

  const loss =
    Math.abs(Number(data.entry) - Number(data.stopLoss)) * qty;

  setPotentialProfit(profit.toFixed(2));
  setPotentialLoss(loss.toFixed(2));
} else {
  setPotentialProfit('--');
  setPotentialLoss('--');
}

setSignalQuality(quality);
setLastAiUpdate(new Date().toLocaleTimeString());

if (data.confidence >= 75) {
  setMarketStatus('Trending');
} else if (data.confidence >= 60) {
  setMarketStatus('Bullish');
} else if (data.confidence <= 40) {
  setMarketStatus('Bearish');
} else {
  setMarketStatus('Neutral');
}

const range = Math.abs(Number(data.resistance) - Number(data.support));

if (range > 400) {
  setVolatility('High');
} else if (range > 180) {
  setVolatility('Medium');
} else {
  setVolatility('Low');
}

let reasoning = '';
let warning = '';
let action = '';

if (data.signal === 'STRONG BUY' || data.signal === 'BUY') {
  reasoning =
    `RSI ${data.rsi.toFixed(2)} bullish zone me hai. MACD bullish crossover confirm hai aur price EMA20, EMA50, aur EMA200 ke upar trade kar raha hai. Multi-timeframe confirmation positive hai, isliye upside momentum strong hai.`;

  warning =
    `Agar price EMA20 (${Math.round(data.ema20)}) ke neeche close karta hai to bullish momentum weak ho sakta hai.`;

  action =
    `Pullback par long entry consider karo. Stop-loss $${Math.round(data.stopLoss)} aur target $${Math.round(data.target)}.`;
} else if (data.signal === 'STRONG SELL' || data.signal === 'SELL') {
  reasoning =
    `RSI ${data.rsi.toFixed(2)} bearish zone me hai. MACD bearish crossover active hai aur price sabhi major moving averages ke neeche trade kar raha hai. Downside continuation ka probability high hai.`;

  warning =
    `EMA20 (${Math.round(data.ema20)}) ke upar strong close bearish setup ko invalidate kar sakta hai.`;

  action =
    `Short setup consider karo. Stop-loss $${Math.round(data.stopLoss)} aur target $${Math.round(data.target)}.`;
} else {
  reasoning =
    `RSI ${data.rsi.toFixed(2)} neutral zone me hai. MACD mixed momentum dikha raha hai aur price key moving averages ke aas-paas consolidate kar raha hai. 15m, 1h aur 4h me clear confirmation nahi hai, isliye HOLD recommendation diya gaya hai.`;

  warning =
    `Resistance $${Math.round(data.resistance)} ke upar breakout ya support $${Math.round(data.support)} ke neeche breakdown ka wait karo.`;

  action =
    `Abhi new trade avoid karo aur breakout confirmation ka wait karo.`;
}

setAiReasoning(reasoning);
setKeyWarning(warning);
setNextAction(action);

setHistory(prev =>
  [
    {
      time: new Date().toLocaleTimeString(),
      timeframe: tf,
      signal: data.signal,
      confidence: data.confidence,
      entry: Number(data.entry).toFixed(0),
    },
    ...prev,
  ].slice(0, 10)
);

if (
  (data.signal === 'STRONG BUY' || data.signal === 'STRONG SELL') &&
  data.confidence >= 75
) {
  fetch('http://localhost:3001/alert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signal: data.signal,
      confidence: data.confidence,
      price: data.price,
      entry: data.entry,
      target: data.target,
      stopLoss: data.stopLoss,
      takeProfit1: data.takeProfit1,
      takeProfit2: data.takeProfit2,
      timeframe: selectedTF,
    }),
  }).catch(console.error);
}

setIsAnalyzing(false);
} catch (err) {
  console.error(err);
  setIsAnalyzing(false);
  alert('Failed to generate AI signal');
}

};

useEffect(() => {
  loadSignal(selectedTF);

  const timer = setInterval(() => {
    loadSignal(selectedTF);
  }, 30000);

  return () => clearInterval(timer);
}, [selectedTF]);
useEffect(() => {
  const loadTicker = async () => {
    try {
      const res = await fetch(
        'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'
      );
      const data = await res.json();

      const change = Number(data.priceChangePercent);
      setPriceChange24h(change.toFixed(2));

      if (change >= 3) setSentiment('Extreme Bullish');
      else if (change >= 1) setSentiment('Bullish');
      else if (change <= -3) setSentiment('Extreme Bearish');
      else if (change <= -1) setSentiment('Bearish');
      else setSentiment('Neutral');
    } catch (err) {
      console.error(err);
    }
  };

  loadTicker();
  const timer = setInterval(loadTicker, 60000);

  return () => clearInterval(timer);
}, []);
useEffect(() => {
  const ws = new WebSocket(
    'wss://stream.binance.com:9443/ws/btcusdt@trade'
  );

  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    setPrice(Number(data.p).toLocaleString());
  };

  ws.onerror = err => {
    console.error('WebSocket error:', err);
  };

  return () => {
    ws.close();
  };
}, []);

const signalColor =
  signal === 'STRONG BUY'
    ? '#00ff88'
    : signal === 'BUY'
    ? '#00d084'
    : signal === 'STRONG SELL'
    ? '#ff2d55'
    : signal === 'SELL'
    ? '#ef4444'
    : '#f59e0b';


const chartInterval =
  selectedTF === '15m'
    ? '15'
    : selectedTF === '1h'
    ? '60'
    : selectedTF === '4h'
    ? '240'
    : '60';
return (
<div
style={{
background: '#081421',
minHeight: '100vh',
color: 'white',
padding: '24px',
fontFamily: 'Arial',
}}
> <h1>Binance Futures Pro</h1>

  <div
    style={{
      background: '#102235',
      borderRadius: '18px',
      padding: '20px',
      marginTop: '20px',
      border: '1px solid #1f3b57',
    }}
  >
    <h2>BTCUSDT Perpetual</h2>
    <div style={{ fontSize: '42px', fontWeight: 'bold' }}>
      ${price}
      <div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '10px',
    flexWrap: 'wrap',
  }}
>
  <div
    style={{
      color: Number(priceChange24h) >= 0 ? '#00d084' : '#ef4444',
      fontWeight: 'bold',
      fontSize: '18px',
    }}
  >
    {Number(priceChange24h) >= 0 ? '+' : ''}
    {priceChange24h}% (24h)
  </div>

  <div
    style={{
      background: '#0b1b2b',
      border: '1px solid #1f3b57',
      borderRadius: '999px',
      padding: '8px 12px',
      color:
        sentiment === 'Extreme Bullish'
          ? '#00ff88'
          : sentiment === 'Bullish'
          ? '#22c55e'
          : sentiment === 'Extreme Bearish'
          ? '#ff2d55'
          : sentiment === 'Bearish'
          ? '#ef4444'
          : '#f59e0b',
      fontWeight: 'bold',
    }}
  >
    {sentiment}
  </div>
</div>
    </div>
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginTop: '18px',
  }}
>
  <div
    style={{
      background: '#0b1b2b',
      border: '1px solid #1f3b57',
      borderRadius: '12px',
      padding: '12px',
    }}
  >
    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Market Status</div>
    <div
      style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color:
          marketStatus === 'Trending'
            ? '#00d084'
            : marketStatus === 'Bullish'
            ? '#22c55e'
            : marketStatus === 'Bearish'
            ? '#ef4444'
            : '#f59e0b',
      }}
    >
      {marketStatus}
    </div>
  </div>

  <div
    style={{
      background: '#0b1b2b',
      border: '1px solid #1f3b57',
      borderRadius: '12px',
      padding: '12px',
    }}
  >
    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Volatility</div>
    <div
      style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color:
          volatility === 'High'
            ? '#ef4444'
            : volatility === 'Medium'
            ? '#f59e0b'
            : '#00d084',
      }}
    >
      {volatility}
    </div>
  </div>

  <div
    style={{
      background: '#0b1b2b',
      border: '1px solid #1f3b57',
      borderRadius: '12px',
      padding: '12px',
    }}
  >
    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Last AI Update</div>
    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
      {lastAiUpdate}
    </div>
  </div>
</div>

    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
      {['15m', '1h', '4h'].map(tf => (
        <button
          key={tf}
          onClick={() => {
            setSelectedTF(tf);
            loadSignal(tf);
          }}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid #1f3b57',
            background: selectedTF === tf ? '#2563eb' : '#0b1b2b',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {tf}
        </button>
      ))}
    </div>

    <button
  onClick={() => loadSignal(selectedTF)}
  disabled={isAnalyzing}
  style={{
    marginTop: '20px',
    width: '100%',
    padding: '16px',
    borderRadius: '14px',
    border: 'none',
    background: '#00d084',
    color: '#081421',
    fontWeight: 'bold',
    fontSize: '18px',
    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
    opacity: isAnalyzing ? 0.8 : 1,
  }}
>
      {isAnalyzing ? 'Analyzing Market...' : 'Generate AI Signal'}
    </button>

    <div
  style={{
    marginTop: '20px',
    display: 'inline-block',
    background: signalColor,
    color: signal === 'HOLD' ? '#111827' : 'white',
    padding: '12px 18px',
    borderRadius: '999px',
    fontWeight: 'bold',
    fontSize: '20px',
    boxShadow: `0 0 20px ${signalColor}`,
  
  }}
>
  {signal} {confidence}%
</div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginTop: '18px',
      }}
    >
      <div
  style={{
    background: '#0b1b2b',
    border: '1px solid #1f3b57',
    borderRadius: '12px',
    padding: '12px',
  }}
>
  <div style={{ color: '#94a3b8', fontSize: '12px' }}>
    Win Probability
  </div>

  <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
    {confidence}%
  </div>

  <div
    style={{
      marginTop: '10px',
      height: '8px',
      background: '#1f3b57',
      borderRadius: '999px',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${confidence}%`,
        height: '100%',
        background:
          confidence >= 75
            ? '#00d084'
            : confidence >= 60
            ? '#22c55e'
            : confidence >= 45
            ? '#f59e0b'
            : '#ef4444',
        borderRadius: '999px',
        transition: 'width 0.4s ease',
      }}
    />
  </div>
</div>

      <div
        style={{
          background: '#0b1b2b',
          border: '1px solid #1f3b57',
          borderRadius: '12px',
          padding: '12px',
        }}
      >
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          Trend Strength
        </div>
        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
          {trendStrength}
        </div>
      </div>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: '18px',
      }}
    >
      {[
        { label: '15m', value: tf15m },
        { label: '1h', value: tf1h },
        { label: '4h', value: tf4h },
      ].map(item => (
        <div
          key={item.label}
          style={{
            background: '#0b1b2b',
            border: '1px solid #1f3b57',
            borderRadius: '12px',
            padding: '12px',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>
            {item.label}
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color:
                item.value === 'BUY'
                  ? '#00d084'
                  : item.value === 'SELL'
                  ? '#ff5b5b'
                  : '#f59e0b',
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))',
        gap: '12px',
        marginTop: '18px',
      }}
    >
      <div>RSI: {rsi}</div>
      <div>
        MACD: {macd} ({macdSignal})
      </div>
      <div>Pattern: {candlePattern}</div>
      <div>EMA20: {ema20}</div>
      <div>EMA50: {ema50}</div>
      <div>EMA200: {ema200}</div>
      <div>Support: ${support}</div>
      <div>Resistance: ${resistance}</div>
      <div
  style={{
    gridColumn: '1 / -1',
    background: '#0b1b2b',
    border: '1px solid #1f3b57',
    borderRadius: '14px',
    padding: '16px',
    marginTop: '8px',
  }}
>
  <h3 style={{ marginBottom: '14px' }}>Trade Setup</h3>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
    }}
  >
    <div
      style={{
        background: '#081421',
        border: '1px solid #1f3b57',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: '12px' }}>Entry</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${entry}</div>
    </div>

    <div
      style={{
        background: '#06281d',
        border: '1px solid #14532d',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#86efac', fontSize: '12px' }}>Take Profit 1</div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#22c55e',
        }}
      >
        ${tp1}
      </div>
    </div>

    <div
      style={{
        background: '#042f2e',
        border: '1px solid #0f766e',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#99f6e4', fontSize: '12px' }}>Take Profit 2</div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#00d084',
        }}
      >
        ${tp2}
      </div>
    </div>

    <div
      style={{
        background: '#2a0b0b',
        border: '1px solid #7f1d1d',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#fca5a5', fontSize: '12px' }}>Stop-loss</div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#ef4444',
        }}
      >
        ${stopLoss}
      </div>
    </div>
  </div>
  <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '14px',
  }}
>
  <div
    style={{
      background: '#06281d',
      border: '1px solid #14532d',
      borderRadius: '12px',
      padding: '12px',
    }}
  >
    <div style={{ color: '#86efac', fontSize: '12px' }}>
      Potential Profit
    </div>
    <div
      style={{
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#00d084',
      }}
    >
      ${potentialProfit}
    </div>
  </div>

  <div
    style={{
      background: '#2a0b0b',
      border: '1px solid #7f1d1d',
      borderRadius: '12px',
      padding: '12px',
    }}
  >
    <div style={{ color: '#fca5a5', fontSize: '12px' }}>
      Potential Loss
    </div>
    <div
      style={{
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#ef4444',
      }}
    >
      ${potentialLoss}
    </div>
  </div>
</div>
</div>
    </div>
    <div
  style={{
    background: '#0b1b2b',
    border: '1px solid #1f3b57',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '18px',
  }}
>
  <h3>Position Size Calculator</h3>

  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
    <div>
      <label>Account Size ($)</label>
      <input
        type="number"
        value={accountSize}
        onChange={e => setAccountSize(Number(e.target.value))}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #1f3b57',
          background: '#081421',
          color: 'white',
        }}
      />
    </div>

    <div>
      <label>Risk %</label>
      <input
        type="number"
        step="0.5"
        value={riskPercent}
        onChange={e => setRiskPercent(Number(e.target.value))}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #1f3b57',
          background: '#081421',
          color: 'white',
        }}
      />
    </div>
  </div>

  <div
    style={{
      marginTop: '14px',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#00d084',
    }}
  >
    Suggested Position Size: {positionSize} BTC
  </div>
</div>

<div
  style={{
    background: '#0b1b2b',
    border: '1px solid #1f3b57',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '18px',
  }}
>
  <h3>Risk / Reward Ratio</h3>

  <div
    style={{
      fontSize: '28px',
      fontWeight: 'bold',
      color: rrRatio !== '--' && rrRatio !== '1:0.00' ? '#00d084' : '#f59e0b',
    }}
  >
    {rrRatio}
  </div>

  <div style={{ color: '#94a3b8', marginTop: '8px' }}>
    Professional traders usually prefer trades with at least 1:2 RR.
  </div>
</div>

<div
  style={{
    background: '#0b1b2b',
    border: '1px solid #1f3b57',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '18px',
  }}
>
  <h3>AI Signal Quality</h3>

  <div
    style={{
      fontSize: '36px',
      fontWeight: 'bold',
      color:
        signalQuality === 'A+'
          ? '#00d084'
          : signalQuality === 'A'
          ? '#22c55e'
          : signalQuality === 'B'
          ? '#f59e0b'
          : '#ef4444',
    }}
  >
    {signalQuality}
  </div>

  <div style={{ color: '#94a3b8', marginTop: '8px' }}>
    Based on confidence, trend strength, and multi-timeframe confirmation.
  </div>
</div>
  </div>
<div
  style={{
    background: '#0b1b2b',
    border: '1px solid #1f3b57',
    borderRadius: '12px',
    padding: '18px',
    marginTop: '18px',
  }}
>
  <div
  style={{
    background: '#0b1b2b',
    border: '1px solid #1f3b57',
    borderRadius: '14px',
    padding: '18px',
    marginTop: '18px',
  }}
>
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '14px',
    }}
  >
    <h3 style={{ margin: 0 }}>Trade Setup Summary</h3>

    <div
      style={{
        background: signalColor,
        color: signal === 'HOLD' ? '#111827' : 'white',
        padding: '6px 12px',
        borderRadius: '999px',
        fontWeight: 'bold',
      }}
    >
      {signal}
    </div>
  </div>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
    }}
  >
    <div
      style={{
        background: '#081421',
        border: '1px solid #1f3b57',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: '12px' }}>Confidence</div>
      <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
        {confidence}%
      </div>
    </div>

    <div
      style={{
        background: '#081421',
        border: '1px solid #1f3b57',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: '12px' }}>Entry</div>
      <div style={{ fontSize: '22px', fontWeight: 'bold' }}>${entry}</div>
    </div>

    <div
      style={{
        background: '#06281d',
        border: '1px solid #14532d',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#86efac', fontSize: '12px' }}>Take Profit 1</div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#22c55e',
        }}
      >
        ${tp1}
      </div>
    </div>

    <div
      style={{
        background: '#042f2e',
        border: '1px solid #0f766e',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#99f6e4', fontSize: '12px' }}>Take Profit 2</div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#00d084',
        }}
      >
        ${tp2}
      </div>
    </div>

    <div
      style={{
        background: '#2a0b0b',
        border: '1px solid #7f1d1d',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#fca5a5', fontSize: '12px' }}>Stop-loss</div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#ef4444',
        }}
      >
        ${stopLoss}
      </div>
    </div>

    <div
      style={{
        background: '#081421',
        border: '1px solid #1f3b57',
        borderRadius: '12px',
        padding: '12px',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: '12px' }}>Risk / Reward</div>
      <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{rrRatio}</div>
    </div>
  </div>
</div>

  <h3 style={{ marginBottom: '12px' }}>AI Reasoning</h3>

  <div
    style={{
      background: '#081421',
      border: '1px solid #1f3b57',
      borderRadius: '10px',
      padding: '14px',
      color: '#d1d5db',
      lineHeight: '1.7',
      marginBottom: '14px',
    }}
  >
    {aiReasoning}
  </div>

  <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>Key Warning</h4>
  <div
    style={{
      background: '#081421',
      border: '1px solid #1f3b57',
      borderRadius: '10px',
      padding: '14px',
      color: '#fbbf24',
      lineHeight: '1.7',
      marginBottom: '14px',
    }}
  >
    {keyWarning}
  </div>

  <h4 style={{ color: '#00d084', marginBottom: '8px' }}>Next Action</h4>
  <div
    style={{
      background: '#081421',
      border: '1px solid #1f3b57',
      borderRadius: '10px',
      padding: '14px',
      color: '#86efac',
      lineHeight: '1.7',
    }}
  >
    {nextAction}
  </div>
</div>

  <div
    style={{
      background: '#102235',
      borderRadius: '18px',
      padding: '20px',
      marginTop: '20px',
      border: '1px solid #1f3b57',
    }}
  >
    <h3>BTCUSDT TradingView Chart</h3>
    <AdvancedRealTimeChart
      theme="dark"
      symbol="BINANCE:BTCUSDT"
      interval={chartInterval}
      width="100%"
      height={500}
      hide_side_toolbar={false}
      allow_symbol_change={false}
    />
  </div>

  <div
    style={{
      background: '#102235',
      borderRadius: '18px',
      padding: '20px',
      marginTop: '20px',
      border: '1px solid #1f3b57',
    }}
  >
    <h3>Signal History</h3>

    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
      }}
    >
      <thead>
        <tr>
          <th>Time</th>
          <th>TF</th>
          <th>Signal</th>
          <th>Confidence</th>
          <th>Entry</th>
        </tr>
      </thead>

      <tbody>
        {history.map((item, i) => (
          <tr key={i}>
            <td>{item.time}</td>
            <td>{item.timeframe}</td>
            <td>{item.signal}</td>
            <td>{item.confidence}%</td>
            <td>${item.entry}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

);
}

export default App;
