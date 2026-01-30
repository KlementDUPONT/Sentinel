const config = {
  // Discord Configuration (selon tes variables Koyeb)
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  
  // Bot Information
  version: 'alpha.2',
  environment: process.env.NODE_ENV || 'production',
  prefix: process.env.BOT_PREFIX_PROD || '!',
  
  // Server Configuration
  port: parseInt(process.env.PORT) || 8000,
  
  // Database
  databasePath: process.env.DATABASE_PATH || '/app/data/sentinel.db',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validation
if (!config.token) {
  console.warn('WARNING: DISCORD_TOKEN is not set');
}

if (!config.clientId) {
  console.warn('WARNING: CLIENT_ID is not set');
}

export default config;
