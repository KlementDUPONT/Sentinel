import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  connect(dbPath) {
    if (this.db) {
      logger.warn('Database already connected');
      return this.db;
    }

    try {
      // Ensure data directory exists
      const dataDir = dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(dbPath);
      this.dbPath = dbPath;
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      
      logger.info(`✅ Database connected: ${dbPath}`);
      return this.db;
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  getDatabase() {
    if (!this.db) {
      logger.warn('⚠️ Database not connected. Auto-connecting...');
      const defaultPath = join(process.cwd(), 'data', 'sentinel.db');
      return this.connect(defaultPath);
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }

  isConnected() {
    return this.db !== null;
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

class DatabaseHandler {
  constructor() {
    this.migrationsPath = join(__dirname, '..', 'database', 'migrations');
  }

  async initialize(dbPath) {
    try {
      logger.info('📦 Initializing database...');
      
      // Connect to database
      const db = dbConnection.connect(dbPath);
      
      // Run migrations
      await this.runMigrations();
      
      logger.info('✅ Database initialized successfully');
      return db;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async runMigrations() {
    const db = dbConnection.getDatabase();
    
    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Get executed migrations
    const executedMigrations = db.prepare('SELECT name FROM migrations').all();
    const executedNames = new Set(executedMigrations.map(m => m.name));

    // Run pending migrations
    const pendingMigrations = migrationFiles.filter(file => !executedNames.has(file));
    
    if (pendingMigrations.length === 0) {
      logger.info('✅ All migrations are up to date');
      return;
    }

    logger.info(`📦 Running ${pendingMigrations.length} migration(s)...`);

    for (const file of pendingMigrations) {
      const migrationPath = join(this.migrationsPath, file);
      logger.info(`⏳ Running migration: ${file}`);
      
      try {
        const migration = await import(`file://${migrationPath}`);
        await migration.up(db);
        
        // Record migration
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
        logger.info(`✅ Migration completed: ${file}`);
      } catch (error) {
        logger.error(`❌ Migration failed: ${file}`, error);
        throw error;
      }
    }

    logger.info('✅ All migrations completed successfully');
  }

  getStats() {
    try {
      const db = dbConnection.getDatabase();
      
      const stats = {
        guilds: db.prepare('SELECT COUNT(*) as count FROM guilds').get().count,
        users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        warns: db.prepare('SELECT COUNT(*) as count FROM warns WHERE active = 1').get().count,
        tickets: {
          total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
          open: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get().count,
          closed: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get().count,
        },
        economy: {
          totalBalance: db.prepare('SELECT SUM(balance) as total FROM users').get().total || 0,
          totalBank: db.prepare('SELECT SUM(bank) as total FROM users').get().total || 0,
        }
      };
      
      return stats;
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      return null;
    }
  }

  // Guild methods
  getGuild(guildId) {
    const db = dbConnection.getDatabase();
    return db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(guildId);
  }

  createGuild(guildId, guildName) {
    const db = dbConnection.getDatabase();
    return db.prepare(`
      INSERT INTO guilds (guild_id, name) 
      VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET name = excluded.name
    `).run(guildId, guildName);
  }

  updateGuildConfig(guildId, config) {
    const db = dbConnection.getDatabase();
    const updates = [];
    const params = [];

    if (config.prefix !== undefined) {
      updates.push('prefix = ?');
      params.push(config.prefix);
    }
    if (config.welcomeChannel !== undefined) {
      updates.push('welcome_channel = ?');
      params.push(config.welcomeChannel);
    }
    if (config.logChannel !== undefined) {
      updates.push('log_channel = ?');
      params.push(config.logChannel);
    }
    if (config.muteRole !== undefined) {
      updates.push('mute_role = ?');
      params.push(config.muteRole);
    }
    if (config.autoRole !== undefined) {
      updates.push('auto_role = ?');
      params.push(config.autoRole);
    }

    params.push(guildId);

    return db.prepare(`
      UPDATE guilds 
      SET ${updates.join(', ')}
      WHERE guild_id = ?
    `).run(...params);
  }

  deleteGuild(guildId) {
    const db = dbConnection.getDatabase();
    return db.prepare('DELETE FROM guilds WHERE guild_id = ?').run(guildId);
  }

  // User methods
  getUser(userId, guildId) {
    const db = dbConnection.getDatabase();
    return db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  }

  createUser(userId, guildId) {
    const db = dbConnection.getDatabase();
    return db.prepare(`
      INSERT INTO users (user_id, guild_id) 
      VALUES (?, ?)
      ON CONFLICT(user_id, guild_id) DO NOTHING
    `).run(userId, guildId);
  }

  updateUserEconomy(userId, guildId, { balance, bank }) {
    const db = dbConnection.getDatabase();
    const updates = [];
    const params = [];

    if (balance !== undefined) {
      updates.push('balance = ?');
      params.push(balance);
    }
    if (bank !== undefined) {
      updates.push('bank = ?');
      params.push(bank);
    }

    params.push(userId, guildId);

    return db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE user_id = ? AND guild_id = ?
    `).run(...params);
  }

  updateUserLevel(userId, guildId, { level, xp }) {
    const db = dbConnection.getDatabase();
    const updates = [];
    const params = [];

    if (level !== undefined) {
      updates.push('level = ?');
      params.push(level);
    }
    if (xp !== undefined) {
      updates.push('xp = ?');
      params.push(xp);
    }

    params.push(userId, guildId);

    return db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE user_id = ? AND guild_id = ?
    `).run(...params);
  }

  // Warning methods
  addWarn(userId, guildId, moderatorId, reason) {
    const db = dbConnection.getDatabase();
    return db.prepare(`
      INSERT INTO warns (user_id, guild_id, moderator_id, reason)
      VALUES (?, ?, ?, ?)
    `).run(userId, guildId, moderatorId, reason);
  }

  getWarns(userId, guildId) {
    const db = dbConnection.getDatabase();
    return db.prepare(`
      SELECT * FROM warns 
      WHERE user_id = ? AND guild_id = ? AND active = 1
      ORDER BY created_at DESC
    `).all(userId, guildId);
  }

  removeWarn(warnId) {
    const db = dbConnection.getDatabase();
    return db.prepare('UPDATE warns SET active = 0 WHERE id = ?').run(warnId);
  }

  clearWarns(userId, guildId) {
    const db = dbConnection.getDatabase();
    return db.prepare('UPDATE warns SET active = 0 WHERE user_id = ? AND guild_id = ?').run(userId, guildId);
  }

  // Leaderboard methods
  getLeaderboard(guildId, type = 'balance', limit = 10) {
    const db = dbConnection.getDatabase();
    const column = type === 'level' ? 'level' : 'balance';
    
    return db.prepare(`
      SELECT user_id, ${column}
      FROM users
      WHERE guild_id = ?
      ORDER BY ${column} DESC
      LIMIT ?
    `).all(guildId, limit);
  }
}

export default new DatabaseHandler();
export { dbConnection };
