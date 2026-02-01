import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
        // Liste des colonnes que le bot doit reconnaître comme valides
        this.supportedColumns = [
            'guild_id', 'name', 'prefix', 'log_channel', 
            'welcome_channel', 'level_system_enabled', 
            'verification_channel', 'verification_role'
        ];
    }

    async initialize() {
        try {
            this.db = dbConnection.connect();

            // 1. Création/Vérification des tables
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guilds (
                    guild_id TEXT PRIMARY KEY,
                    name TEXT,
                    prefix TEXT DEFAULT '!',
                    log_channel TEXT,
                    welcome_channel TEXT,
                    level_system_enabled INTEGER DEFAULT 0,
                    verification_channel TEXT,
                    verification_role TEXT
                );
            `);

            // 2. Vérification dynamique pour s'assurer que les colonnes existent physiquement
            const info = this.db.prepare("PRAGMA table_info(guilds)").all();
            const existingColumns = info.map(col => col.name);
            
            ['verification_channel', 'verification_role'].forEach(col => {
                if (!existingColumns.includes(col)) {
                    this.db.exec(`ALTER TABLE guilds ADD COLUMN ${col} TEXT;`);
                    logger.info(`✅ Added missing column: ${col}`);
                }
            });

            logger.info('✅ DatabaseHandler: Fully synchronized for Beta.');
            return this.db;
        } catch (error) {
            logger.error('❌ DatabaseHandler Error:', error);
            throw error;
        }
    }

    // Garde tes autres méthodes (getGuild, updateVerification, etc.) ici...
    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?
        `).run(channelId, roleId, guildId);
    }
}

export default new DatabaseHandler();