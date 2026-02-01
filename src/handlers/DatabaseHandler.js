import dbConnection from '../database/connection.js';
import logger from '../utils/logger.js';

class DatabaseHandler {
    constructor() {
        this.db = null;
        // Liste des colonnes supportées pour la validation des commandes admin
        this.supportedColumns = [
            'guild_id', 
            'name', 
            'prefix', 
            'verification_channel', 
            'verification_role',
            'log_channel'
        ];
    }

    async initialize() {
        try {
            this.db = dbConnection.connect();

            // 1. Création de la table guilds (Focus : Config & Vérification)
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guilds (
                    guild_id TEXT PRIMARY KEY,
                    name TEXT,
                    prefix TEXT DEFAULT '!',
                    verification_channel TEXT,
                    verification_role TEXT,
                    log_channel TEXT
                );
            `);

            // 2. Vérification dynamique des colonnes de vérification
            this.verifySchema();
            
            logger.info('✅ DatabaseHandler : Focus Vérification activé. (XP désactivé)');
            return this.db;
        } catch (error) {
            logger.error('❌ DatabaseHandler Error:', error);
            throw error;
        }
    }

    verifySchema() {
        const info = this.db.prepare("PRAGMA table_info(guilds)").all();
        const columns = info.map(col => col.name);
        
        ['verification_channel', 'verification_role'].forEach(col => {
            if (!columns.includes(col)) {
                try {
                    this.db.exec(`ALTER TABLE guilds ADD COLUMN ${col} TEXT;`);
                    logger.info(`++ Migration : Colonne ${col} ajoutée.`);
                } catch (e) {
                    logger.error(`Erreur migration ${col}:`, e.message);
                }
            }
        });
    }

    // --- Méthodes de Gestion ---

    getGuild(guildId) {
        return this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
    }

    createGuild(guildId, guildName) {
        return this.db.prepare(`
            INSERT INTO guilds (guild_id, name) 
            VALUES (?, ?) 
            ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
        `).run(guildId, guildName);
    }

    updateVerification(guildId, channelId, roleId) {
        return this.db.prepare(`
            UPDATE guilds SET verification_channel = ?, verification_role = ? WHERE guild_id = ?
        `).run(channelId, roleId, guildId);
    }

    // Stats simplifiées pour le Panel Web
    getStats() {
        try {
            const guilds = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get()?.count || 0;
            return { guilds, users: "N/A (XP Off)", warns: 0 };
        } catch (e) {
            return { guilds: 0, users: 0, warns: 0 };
        }
    }
}

export default new DatabaseHandler();