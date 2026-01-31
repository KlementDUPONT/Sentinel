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

        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                uptime: process.uptime(),
                botReady: this.client.isReady(),
                guilds: this.client.guilds.cache.size
            });
        });

        app.get('/', (req, res) => {
            res.status(200).send('Sentinel Bot is running.');
        });

        this.healthServer = app.listen(port, '0.0.0.0', () => {
            logger.info('✅ Express health server listening on port ' + port);
        });
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            logger.info('🚀 Starting Sentinel Bot Initialization...');

            // Step 1: Database (Must be first)
            logger.info('📦 Step 1/4: Database initialization');
            await databaseHandler.initialize(config.databasePath);

            // Step 2: Load handlers
            logger.info('📦 Step 2/4: Loading events');
            await this.eventHandler.loadEvents(join(__dirname, 'events'));

            logger.info('📦 Step 3/4: Loading commands');
            await this.commandHandler.loadCommands(join(__dirname, 'commands'));

            // Step 4: Discord Login
            logger.info('📦 Step 4/4: Connecting to Discord...');
            await this.client.login(config.token.trim());

            this.isInitialized = true;
        } catch (error) {
            logger.error('❌ Failed to initialize bot:', error);
            process.exit(1);
        }
    }
}

const bot = new SentinelBot();
bot.setupHealthCheck();
bot.initialize();

export default bot;