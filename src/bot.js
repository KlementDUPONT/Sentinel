import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './utils/logger.js';
import config from './config/config.js';
import databaseHandler from './handlers/DatabaseHandler.js';
import EventHandler from './handlers/EventHandler.js';
import CommandHandler from './handlers/CommandHandler.js';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  async initialize() {
    try {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('🚀 Starting Sentinel...');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`📌 Version: ${config.version}`);
      logger.info(`🌍 Environment: ${config.environment}`);
      logger.info(`🔧 Prefix: ${config.prefix}`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Step 1: Initialize database
      logger.info('📦 Step 1/4: Database initialization');
      const dbPath = join(process.cwd(), 'data', 'sentinel.db');
      await databaseHandler.initialize(dbPath);

      // Step 2: Load events
      logger.info('📦 Step 2/4: Loading events');
      const eventsPath = join(__dirname, 'events');
      await this.eventHandler.loadEvents(eventsPath);

      // Step 3: Load commands
      logger.info('📦 Step 3/4: Loading commands');
      const commandsPath = join(__dirname, 'commands');
      await this.commandHandler.loadCommands(commandsPath);

      // Step 4: Connect to Discord
      logger.info('📦 Step 4/4: Connecting to Discord');
      await this.client.login(config.token);

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('✅ Initialization completed successfully');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      logger.error('❌ Failed to initialize bot:');
      logger.error(error.message, error);
      process.exit(1);
    }
  }

  setupHealthCheck() {
    const app = express();
    const port = process.env.PORT || 8000;

    app.get('/health', (req, res) => {
      const health = {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now(),
        bot: {
          ready: this.client.isReady(),
          guilds: this.client.guilds.cache.size,
          users: this.client.users.cache.size,
        }
      };
      res.json(health);
    });

    app.get('/', (req, res) => {
      res.json({
        name: 'Sentinel Bot',
        version: config.version,
        status: this.client.isReady() ? 'online' : 'offline'
      });
    });

    app.listen(port, () => {
      logger.info(`🌐 Health check server running on port ${port}`);
    });
  }
}

// Error handlers
process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Promise Rejection:');
  logger.error(error.message, error);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:');
  logger.error(error.message, error);
  logger.error('🔄 Restarting bot due to uncaught exception...');
  process.exit(1);
});

// Initialize bot
const bot = new SentinelBot();
bot.setupHealthCheck();
await bot.initialize();

export default bot;
