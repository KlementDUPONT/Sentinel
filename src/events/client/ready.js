import { ActivityType } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
  name: 'clientReady',
  category: 'client',
  once: true,

  async execute(client) {
    try {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`✅ ${client.user.tag} is now online!`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`📊 Guilds: ${client.guilds.cache.size}`);
      logger.info(`👥 Users: ${client.users.cache.size}`);
      logger.info(`📝 Commands: ${client.commands.size}`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Set bot status
      client.user.setPresence({
        activities: [
          {
            name: `${client.guilds.cache.size} serveurs | /help`,
            type: ActivityType.Watching,
          },
        ],
        status: 'online',
      });

      // Auto-deploy slash commands
      await deployCommands(client);

      // Initialize database for all guilds
      await initializeGuilds(client);

      // Check database health
      checkDatabaseHealth(client);

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('🎉 Sentinel is ready to serve!');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      logger.error('❌ Error executing event clientReady:', error);
    }
  },
};

async function deployCommands(client) {
  try {
    logger.info('🔄 Auto-deploying slash commands...');

    // Convert commands to JSON format
    const commands = Array.from(client.commands.values()).map((cmd) => cmd.data.toJSON());

    logger.info(`🔄 Deploying ${commands.length} slash commands...`);

    // Deploy to all guilds
    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.commands.set(commands);
      } catch (error) {
        logger.error(`Failed to deploy commands to guild ${guild.name}:`, error);
      }
    }

    logger.info('✅ Successfully deployed guild commands');
  } catch (error) {
    logger.error('Failed to deploy commands:', error);
  }
}

async function initializeGuilds(client) {
  try {
    const db = client.db;

    for (const guild of client.guilds.cache.values()) {
      // Check if guild exists in database
      const existingGuild = db.getGuild(guild.id);

      if (!existingGuild) {
        // Create guild entry
        db.createGuild(guild.id, guild.name);
        logger.info(`📝 Registered new guild: ${guild.name} (${guild.id})`);
      }

      // Initialize users for this guild
      for (const member of guild.members.cache.values()) {
        if (!member.user.bot) {
          const existingUser = db.getUser(member.id, guild.id);
          if (!existingUser) {
            db.createUser(member.id, guild.id);
          }
        }
      }
    }

    logger.info('✅ All guilds initialized');
  } catch (error) {
    logger.error('Failed to initialize guilds:', error);
  }
}

function checkDatabaseHealth(client) {
  try {
    const db = client.db;
    const stats = db.getStats();

    if (stats) {
      logger.info('💾 Database: Healthy');
      logger.info(`   - Guilds: ${stats.guilds}`);
      logger.info(`   - Users: ${stats.users}`);
      logger.info(`   - Active warns: ${stats.warns}`);
      logger.info(`   - Tickets: ${stats.tickets.total} (${stats.tickets.open} open, ${stats.tickets.closed} closed)`);
      logger.info(`   - Economy: ${stats.economy.totalBalance} coins in circulation`);
    } else {
      logger.warn('⚠️ Database stats unavailable');
    }
  } catch (error) {
    logger.error('Failed to get database stats:', error);
  }
}
