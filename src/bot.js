import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/config.js';
import databaseHandler from './handlers/DatabaseHandler.js';
import EventHandler from './handlers/EventHandler.js';
import CommandHandler from './handlers/CommandHandler.js';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import logger avec fallback
let logger;
try {
  const loggerModule = await import('./utils/logger.js');
  logger = loggerModule.default;
} catch (error) {
  logger = {
    info: (msg) => console.log('[INFO]', msg),
    error: (msg, err) => console.error('[ERROR]', msg, err || ''),
    warn: (msg) => console.warn('[WARN]', msg),
    debug: (msg) => console.log('[DEBUG]', msg)
  };
}

class SentinelBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
      ],
    });

    this.config = config;
    this.client.config = config;
    this.client.commands = new Collection();
    this.client.cooldowns = new Map();
    this.client.db = databaseHandler;

    this.eventHandler = new EventHandler(this.client);
    this.commandHandler = new CommandHandler(this.client);
  }

  setupHealthCheck() {
    const app = express();
    const port = config.port;

    logger.info('🔧 Configuring health check on port ' + port);

    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now(),
        port: port
      });
    });

    app.get('/', (req, res) => {
      res.status(200).json({
        name: 'Sentinel Bot',
        version: config.version,
        status: this.client.isReady() ? 'online' : 'starting',
        uptime: process.uptime()
      });
    });

    const server = app.listen(port, '0.0.0.0', () => {
      logger.info('✅ Express server listening on 0.0.0.0:' + port);
    });

    server.on('error', (error) => {
      logger.error('❌ Express server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error('⚠️ Port ' + port + ' is already in use!');
        process.exit(1);
      }
    });

    return server;
  }

  async initialize() {
    try {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('🚀 Starting Sentinel Bot...');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('📌 Version: ' + config.version);
      logger.info('🌍 Environment: ' + config.environment);
      logger.info('🔧 Prefix: ' + config.prefix);
      logger.info('🔑 Token: ' + (config.token ? '✅ Found' : '❌ Missing'));
      logger.info('🆔 Client ID: ' + (config.clientId ? '✅ Found' : '❌ Missing'));
      logger.info('🏠 Guild ID: ' + (config.guildId ? '✅ Found' : '❌ Missing'));
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (!config.token) {
        throw new Error('DISCORD_TOKEN is not defined!');
      }

      // Step 1: Initialize database
      logger.info('📦 Step 1/4: Database initialization');
      const dbPath = config.databasePath;
      await databaseHandler.initialize(dbPath);
      logger.info('✅ Database ready at ' + dbPath);

      // Step 2: Load events
      logger.info('📦 Step 2/4: Loading events');
      const eventsPath = join(__dirname, 'events');
      await this.eventHandler.loadEvents(eventsPath);
      logger.info('✅ Events loaded');

      // Step 3: Load commands
      logger.info('📦 Step 3/4: Loading commands');
      const commandsPath = join(__dirname, 'commands');
      await this.commandHandler.loadCommands(commandsPath);
      logger.info('✅ Commands loaded');

      // Step 4: Connect to Discord
      logger.info('📦 Step 4/4: Connecting to Discord...');
      await this.client.login(config.token);
      logger.info('✅ Discord connection established');

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('✅ Bot initialization completed successfully');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      logger.error('❌ Failed to initialize bot:');
      logger.error('Error message: ' + error.message);
      if (error.stack) {
        logger.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }
}

// Error handlers
process.on('unhandledRejection', (error) => {
  if (logger && logger.error) {
    logger.error('❌ Unhandled Promise Rejection:', error);
  } else {
    console.error('❌ Unhandled Promise Rejection:', error);
  }
});

process.on('uncaughtException', (error) => {
  if (logger && logger.error) {
    logger.error('❌ Uncaught Exception:', error);
  } else {
    console.error('❌ Uncaught Exception:', error);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  if (logger && logger.info) {
    logger.info('🛑 SIGINT received, shutting down...');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (logger && logger.info) {
    logger.info('🛑 SIGTERM received, shutting down...');
  }
  process.exit(0);
});

// Démarrage
logger.info('🌟 Starting Sentinel Bot Service...');

const bot = new SentinelBot();

logger.info('🌐 Step 1: Starting health check server...');
bot.setupHealthCheck();

logger.info('⏳ Step 2: Waiting 1 second before Discord connection...');
setTimeout(async () => {
  logger.info('🤖 Step 3: Initializing Discord bot...');
  await bot.initialize();
}, 1000);

export default bot;
