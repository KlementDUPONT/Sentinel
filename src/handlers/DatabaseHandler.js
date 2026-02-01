import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
    }

    /**
     * Initialise la connexion et crée le schéma si nécessaire
     */
    async initialize() {
        try {
            this.db = dbConnection.connect();

            // 1. CRÉATION DES TABLES DE BASE (Si elles n'existent pas)
            // On s'assure que la table 'guilds' existe avant toute manipulation
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

                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT,
                    guild_id TEXT,
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 0,
                    PRIMARY KEY (user_id, guild_id)
                );

                CREATE TABLE IF NOT EXISTS warns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    guild_id TEXT,
                    reason TEXT,
                    moderator_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    active INTEGER DEFAULT 1
                );
            `);

            // 2. MIGRATION (BETA) : Ajout de colonnes si tu as déjà une DB ancienne
            // On utilise des blocs try/catch individuels pour ne pas crash si la colonne existe déjà
            try {
                this.db.exec("ALTER TABLE guilds ADD COLUMN verification_channel TEXT;");
            } catch (e) { /* Colonne déjà présente */ }

            try {
                this.db.exec("ALTER TABLE guilds ADD COLUMN verification_role TEXT;");
            } catch (e) { /* Colonne déjà présente */ }
            
            logger.info('✅ DatabaseHandler: Schema verified and ready.');
            return this.db;
        } catch (error) {
            logger.error('❌ DatabaseHandler Initialization Error:', error);
            throw error;
        }
    }

    // --- MÉTHODES POUR LES GUILDES ---

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

    // --- MÉTHODES DE VÉRIFICATION (Nouveau) ---

    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?
        `).run(channelId, roleId, guildId);
    }

    // --- MÉTHODES POUR LES UTILISATEURS ---

    getUser(userId, guildId) {
        return this.db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    }

    createUser(userId, guildId) {
        return this.db.prepare('INSERT OR IGNORE INTO users (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
    }

    // --- STATISTIQUES POUR LE PANEL WEB ---

    getStats() {
        try {
            const guildsCount = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get()?.count || 0;
            const usersCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
            const activeWarns = this.db.prepare('SELECT COUNT(*) as count FROM warns WHERE active = 1').get()?.count || 0;
            
            return {
                guilds: guildsCount,
                users: usersCount,
                warns: activeWarns,
                economy: {
                    totalBalance: 0 // À implémenter si tu as une table économie
                }
            };
        } catch (error) {
            logger.error('Failed to fetch stats:', error);
            return { guilds: 0, users: 0, warns: 0, economy: { totalBalance: 0 } };
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            logger.info('💾 Database connection closed.');
        }
    }
}

export default new DatabaseHandler();