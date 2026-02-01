import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
    }

    async initialize() {
        try {
            this.db = dbConnection.connect();
            // On s'assure que les colonnes de vérification existent
            this.db.exec(`
                ALTER TABLE guilds ADD COLUMN verification_channel TEXT;
                ALTER TABLE guilds ADD COLUMN verification_role TEXT;
            `).catch(() => {}); // On ignore si les colonnes existent déjà
            
            logger.info('✅ DatabaseHandler initialized with verification support');
            return this.db;
        } catch (error) {
            logger.error('❌ Failed to initialize DatabaseHandler:', error);
            throw error;
        }
    }

    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }

    createGuild(guildId, guildName) {
        return this.db.prepare(`
            INSERT INTO guilds (guild_id, name) VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
        `).run(guildId, guildName);
    }

    updateGuildConfig(guildId, updates) {
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        return this.db.prepare(`UPDATE guilds SET ${setClause} WHERE guild_id = ?`).run(...values, guildId);
    }

    // Ajout de la fonction manquante qui faisait crash /setup-verification
    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?
        `).run(channelId, roleId, guildId);
    }

    getStats() {
        try {
            const guilds = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get().count;
            const users = this.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
            const warns = this.db.prepare('SELECT COUNT(*) as count FROM warns WHERE active = 1').get().count;
            return { guilds, users, warns };
        } catch (e) {
            return { guilds: 0, users: 0, warns: 0 };
        }
    }
}

export default new DatabaseHandler();