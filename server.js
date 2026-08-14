import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// =========================
// Alert cooldown (30 min)
// =========================
const lastAlerts = new Map();
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

app.post('/alert', async (req, res) => {
  try {
    const {
      signal,
      confidence,
      price,
      entry,
      stopLoss,
      takeProfit1,
      takeProfit2,
      timeframe,
    } = req.body;

    // Send only strong signals
    if (
      (signal === 'STRONG BUY' && confidence >= 75) ||
      (signal === 'STRONG SELL' && confidence >= 75)
    ) {
      const key = `${timeframe || '1h'}-${signal}`;
      const now = Date.now();
      const lastSent = lastAlerts.get(key) || 0;

      if (now - lastSent > ALERT_COOLDOWN_MS) {
        const message =
          '🚨 Binance Futures Pro Alert\\n\\n' +
          'Timeframe: ' + (timeframe || '1h') + '\\n' +
          'Signal: ' + signal + '\\n' +
          'Confidence: ' + confidence + '%\\n' +
          'Price: $' + price + '\\n' +
          'Entry: $' + entry + '\\n' +
          'TP1: $' + takeProfit1 + '\\n' +
          'TP2: $' + takeProfit2 + '\\n' +
          'Stop-loss: $' + stopLoss;

        await bot.sendMessage(CHAT_ID, message);

        lastAlerts.set(key, now);
        console.log(`Telegram alert sent: ${key}`);
      } else {
        console.log(`Cooldown active, skipped alert: ${key}`);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Telegram alert server is running');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Telegram alert server running on http://localhost:${PORT}`);
});