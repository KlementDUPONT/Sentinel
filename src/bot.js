import { Client, GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import express from 'express';
import config from './config/config.js';
import logger from './utils/logger.js';
import ErrorHandler from './handlers/ErrorHandler.js';
import DatabaseHandler from './handlers/DatabaseHandler.js';
import CommandHandler from './handlers/CommandHandler.js';
import EventHandler from './handlers/EventHandler.js';

/**
 * Point d'entrée principal du bot Sentinel
 */

// Créer le client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
  presence: {
    activities: [{
      name: `${config.bot.defaultPrefix}help | Démarrage...`,
      type: ActivityType.Watching,
    }],
    status: 'dnd',
  },
});

// Initialiser les handlers
const errorHandler = new ErrorHandler(client);
const databaseHandler = new DatabaseHandler();
const commandHandler = new CommandHandler(client);
const eventHandler = new EventHandler(client);

// Attacher les handlers au client
client.errorHandler = errorHandler;
client.databaseHandler = databaseHandler;
client.commandHandler = commandHandler;
client.eventHandler = eventHandler;

/**
 * Fonction d'initialisation principale
 */
async function initialize() {
  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🚀 Starting ${config.bot.name}...`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`📌 Version: ${config.bot.version}`);
    logger.info(`🌍 Environment: ${config.env.nodeEnv}`);
    logger.info(`🔧 Prefix: ${config.bot.defaultPrefix}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Initialiser la base de données
    logger.info('📦 Step 1/4: Database initialization');
    await databaseHandler.initialize();

    // 2. Charger les événements
    logger.info('📦 Step 2/4: Loading events');
    await eventHandler.loadEvents();

    // 3. Charger les commandes
    logger.info('📦 Step 3/4: Loading commands');
    await commandHandler.loadCommands();

    // 4. Connexion à Discord
    logger.info('📦 Step 4/4: Connecting to Discord');
    await client.login(config.discord.token);

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('✅ Initialization completed successfully');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    logger.error('❌ Failed to initialize bot:');
    logger.error(error);
    process.exit(1);
  }
}

/**
 * Arrêt propre du bot
 */
async function shutdown(signal) {
  logger.info(`🛑 Received ${signal}, shutting down gracefully...`);

  try {
    // Fermer la base de données
    logger.info('💾 Closing database connection...');
    databaseHandler.close();

    // Déconnecter le client
    logger.info('👋 Logging out from Discord...');
    client.destroy();

    logger.info('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:');
    logger.error(error);
    process.exit(1);
  }
}

// Gestion des signaux d'arrêt
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Nettoyage périodique de la base de données (toutes les 24h)
setInterval(() => {
  logger.info('🧹 Running scheduled database cleanup...');
  databaseHandler.cleanup();
}, 24 * 60 * 60 * 1000);

// ========================================
// Health Check Server pour Koyeb
// ========================================
const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    bot: client.user?.tag || 'Starting...',
    uptime: Math.floor(process.uptime()),
    guilds: client.guilds?.cache.size || 0,
    users: client.users?.cache.size || 0,
    version: config.bot.version,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/stats', (req, res) => {
  const stats = {
    bot: client.user?.tag || 'Starting...',
    guilds: client.guilds?.cache.size || 0,
    users: client.users?.cache.size || 0,
    commands: client.commands?.size || 0,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
  };
  res.status(200).json(stats);
});

// Démarrer le serveur HTTP
app.listen(PORT, () => {
  logger.info(`🌐 Health check server running on port ${PORT}`);
});

// Démarrer le bot Discord
initialize();

export default client;
