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
    
    this.isInitialized = false;
    this.healthServer = null;
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
        port: port,
        botReady: this.client.isReady()
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
      }
    });

    this.healthServer = server;
    return server;
  }

  async initialize() {
    if (this.isInitialized) {
      logger.warn('⚠️ Bot already initialized, skipping...');
      return;
    }

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
        throw new Error('❌ DISCORD_TOKEN is not defined in environment variables!');
      }

      // Step 1: Initialize database
      logger.info('📦 Step 1/4: Database initialization');
      try {
        const dbPath = config.databasePath;
        await databaseHandler.initialize(dbPath);
        logger.info('✅ Database ready at ' + dbPath);
      } catch (dbError) {
        logger.error('❌ Database initialization failed:', dbError);
        throw dbError;
      }

      // Step 2: Load events
      logger.info('📦 Step 2/4: Loading events');
      try {
        const eventsPath = join(__dirname, 'events');
        await this.eventHandler.loadEvents(eventsPath);
        logger.info('✅ Events loaded successfully');
      } catch (eventError) {
        logger.error('❌ Events loading failed:', eventError);
        throw eventError;
      }

      // Step 3: Load commands
      logger.info('📦 Step 3/4: Loading commands');
      try {
        const commandsPath = join(__dirname, 'commands');
        await this.commandHandler.loadCommands(commandsPath);
        logger.info('✅ Commands loaded successfully');
      } catch (cmdError) {
        logger.error('❌ Commands loading failed:', cmdError);
        throw cmdError;
      }

      // Step 4: Connect to Discord
      logger.info('📦 Step 4/4: Connecting to Discord...');
      try {
        await this.client.login(config.token);
        this.isInitialized = true;
        logger.info('✅ Discord connection established');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info('✅ Bot initialization completed successfully');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } catch (loginError) {
        logger.error('❌ Discord login failed:', loginError);
        throw loginError;
      }

    } catch (error) {
      logger.error('❌ Failed to initialize bot:');
      logger.error('Error message: ' + error.message);
      if (error.stack) {
        logger.error('Stack trace:');
        console.error(error.stack);
      }
      
      // Cleanup on failure
      await this.cleanup();
      process.exit(1);
    }
  }

  async cleanup() {
    logger.info('🧹 Cleaning up resources...');
    
    try {
      if (this.client && this.client.isReady()) {
        this.client.destroy();
        logger.info('✅ Discord client destroyed');
      }
      
      if (this.healthServer) {
        this.healthServer.close();
        logger.info('✅ Health server closed');
      }
      
      if (databaseHandler && databaseHandler.db) {
        databaseHandler.close();
        logger.info('✅ Database closed');
      }
    } catch (cleanupError) {
      logger.error('⚠️ Error during cleanup:', cleanupError);
    }
  }

  async shutdown() {
    logger.info('🛑 Shutting down Sentinel Bot...');
    await this.cleanup();
    logger.info('👋 Shutdown complete');
    process.exit(0);
  }
}

// Global error handlers
process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Promise Rejection:');
  console.error(error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

let bot = null;

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, shutting down...');
  if (bot) {
    await bot.shutdown();
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down...');
  if (bot) {
    await bot.shutdown();
  } else {
    process.exit(0);
  }
});

// Démarrage avec protection
async function startBot() {
  try {
    logger.info('🌟 Starting Sentinel Bot Service...');

    bot = new SentinelBot();

    logger.info('🌐 Step 1: Starting health check server...');
    bot.setupHealthCheck();

    logger.info('⏳ Step 2: Waiting 2 seconds before Discord connection...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    logger.info('🤖 Step 3: Initializing Discord bot...');
    await bot.initialize();

  } catch (error) {
    logger.error('❌ Fatal error during startup:');
    console.error(error);
    process.exit(1);
  }
}

// Lancer le bot
startBot();

export default bot;
