import { ActivityType } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
    name: 'ready', // Changé de clientReady à ready (standard d.js)
    once: true,

    async execute(client) {
        try {
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info(`✅ Logged in as ${client.user.tag}`);
            logger.info(`📊 Serving ${client.guilds.cache.size} guilds`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            client.user.setPresence({
                activities: [{ name: `${client.guilds.cache.size} serveurs | /help`, type: ActivityType.Watching }],
                status: 'online',
            });

            // Initialize database for guilds
            await initializeGuilds(client);

            // Check health
            checkDatabaseHealth(client);

            logger.info('🎉 Sentinel is fully operational!');
        } catch (error) {
            logger.error('❌ Error in ready event:', error);
        }
    },
};

async function initializeGuilds(client) {
    const db = client.db;

    // Vérification de sécurité : est-ce que la table existe ?
    const tableCheck = db.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='guilds';").get();
    if (!tableCheck) {
        logger.warn('⚠️ Database tables not found. Waiting for migrations...');
        return;
    }

    for (const guild of client.guilds.cache.values()) {
        try {
            const existingGuild = db.getGuild(guild.id);
            if (!existingGuild) {
                db.createGuild(guild.id, guild.name);
                logger.info(`📝 Registered guild: ${guild.name}`);
            }
        } catch (err) {
            logger.error(`Failed to init guild ${guild.id}:`, err.message);
        }
    }
}

function checkDatabaseHealth(client) {
    try {
        const stats = client.db.getStats();
        if (stats) {
            logger.info(`💾 DB Status: ${stats.guilds} Guilds | ${stats.users} Users`);
        }
    } catch (error) {
        logger.warn('💾 Database stats not available yet.');
    }
}