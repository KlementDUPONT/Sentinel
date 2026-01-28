import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  // Bot Information
  bot: {
    name: process.env.NODE_ENV === 'production' ? 'Sentinel' : 'Sentinel Alpha',
    version: '2.0.0-alpha.1',
    prefix: {
      dev: process.env.BOT_PREFIX_DEV || '+dev',
      prod: process.env.BOT_PREFIX_PROD || '+',
    },
    defaultPrefix: process.env.NODE_ENV === 'production' 
      ? (process.env.BOT_PREFIX_PROD || '+')
      : (process.env.BOT_PREFIX_DEV || '+dev'),
  },

  // Discord Configuration
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID, // For testing guild commands
  },

  // Database
  database: {
    path: process.env.DATABASE_PATH || './data/sentinel.db',
  },

  // API & Dashboard
  api: {
    port: parseInt(process.env.API_PORT) || 3001,
    host: process.env.API_HOST || 'localhost',
    sessionSecret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  },

  dashboard: {
    url: process.env.DASHBOARD_URL || 'http://localhost:3000',
    callbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001/auth/callback',
  },

  // OAuth2
  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID || process.env.CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    redirectUri: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001/auth/callback',
  },

  // Environment
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Pastel Colors
  colors: {
    pastel: [
      0xFFB3BA, // Rose pastel
      0xFFDFBA, // Pêche pastel
      0xFFFFBA, // Jaune pastel
      0xBAFFC9, // Vert menthe pastel
      0xBAE1FF, // Bleu ciel pastel
      0xD4BAFF, // Lavande pastel
      0xFFBAF3, // Rose-violet pastel
      0xB5EAD7, // Vert d'eau pastel
    ],
    success: 0xBAFFC9,  // Vert menthe
    error: 0xFFB3BA,    // Rose pastel
    warning: 0xFFDFBA,  // Pêche pastel
    info: 0xBAE1FF,     // Bleu ciel pastel
  },

  // Get random pastel color
  getRandomColor() {
    return this.colors.pastel[Math.floor(Math.random() * this.colors.pastel.length)];
  },
};

// Validation des variables d'environnement requises
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

export default config;
