export async function up(db) {
  console.log('🔄 Creating initial database schema...');

  // Guilds table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guilds (
      guild_id TEXT PRIMARY KEY,
      name TEXT,
      prefix TEXT DEFAULT '+',
      welcome_channel TEXT,
      log_channel TEXT,
      mute_role TEXT,
      auto_role TEXT,
      level_system_enabled BOOLEAN DEFAULT 1,
      economy_enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      balance INTEGER DEFAULT 0,
      bank INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      last_daily DATETIME,
      last_work DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, guild_id),
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Warns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL UNIQUE,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      channel_id TEXT,
      category TEXT,
      status TEXT DEFAULT 'open',
      closed_by TEXT,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Moderation logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mod_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_guild ON users(guild_id);
    CREATE INDEX IF NOT EXISTS idx_users_user_guild ON users(user_id, guild_id);
    CREATE INDEX IF NOT EXISTS idx_warns_user_guild ON warns(user_id, guild_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_mod_logs_guild ON mod_logs(guild_id);
  `);

  console.log('✅ Initial schema created successfully');
}

export async function down(db) {
  console.log('🔄 Rolling back initial schema...');
  
  db.exec(`
    DROP TABLE IF EXISTS mod_logs;
    DROP TABLE IF EXISTS tickets;
    DROP TABLE IF EXISTS warns;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS guilds;
  `);
  
  console.log('✅ Initial schema rolled back');
}
