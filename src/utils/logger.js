import winston from 'winston';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Créer le dossier logs s'il n'existe pas
const logsDir = join(__dirname, '../../logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Format personnalisé
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = timestamp + ' [' + level + ']: ' + message;
  
  if (Object.keys(metadata).length > 0) {
    msg += ' ' + JSON.stringify(metadata);
  }
  
  return msg;
});

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

// Méthodes utilitaires
logger.command = (user, command, guild) => {
  logger.info('Command: /' + command + ' by ' + user + ' in ' + (guild || 'DM'));
};

logger.event = (eventName, details = '') => {
  logger.info('Event: ' + eventName + ' ' + details);
};

logger.database = (action, details = '') => {
  logger.debug('Database: ' + action + ' ' + details);
};

logger.api = (method, endpoint, status) => {
  logger.info('API: ' + method + ' ' + endpoint + ' - ' + status);
};

// Mode développement
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
  logger.debug('Logger initialized in development mode');
}

export default logger;
