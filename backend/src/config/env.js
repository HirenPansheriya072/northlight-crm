require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}. Copy .env.example to .env first.`);
    process.exit(1);
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  cookie: {
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: String(process.env.COOKIE_SECURE) === 'true',
  },
  demo: {
    email: process.env.DEMO_EMAIL || 'demo@northlight.co',
    password: process.env.DEMO_PASSWORD || 'demo1234',
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Northlight CRM <no-reply@northlight.co>',
  },
  enableReminderCron: String(process.env.ENABLE_REMINDER_CRON) === 'true',
};
