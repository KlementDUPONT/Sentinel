import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
        this.supportedColumns = ['guild_id', 'name', 'verification_channel', 'verification_role'];
    }

    async initialize() {
        this.db = dbConnection.connect();
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id TEXT PRIMARY KEY,
                name TEXT,
                verification_channel TEXT,
                verification_role TEXT
            );
        `);
        logger.info('✅ DB: Prête.');
    }

    createGuild(guildId, guildName) {
        return this.db.prepare(`
            INSERT INTO guilds (guild_id, name) VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
        `).run(guildId, guildName);
    }

    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?
        `).run(channelId, roleId, guildId);
    }

    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }

    getStats() {
        const row = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get();
        return { guilds: row?.count || 0, users: 0, warns: 0 };
    }
}
export default new DatabaseHandler();