import winston from 'winston';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Créer le dossier logs s'il n'existe pas
const logsDir = join(__dirname, '../../logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Format personnalisé pour les logs
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Ajouter les métadonnées si présentes
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Configuration du logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    // Console avec couleurs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    
    // Fichier pour toutes les erreurs
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Fichier pour les warnings
    new winston.transports.File({
      filename: join(logsDir, 'warn.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    
    // Fichier pour tous les logs
    new winston.transports.File({
      filename: join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

// Méthodes utilitaires
logger.command = (user, command, guild) => {
  logger.info(`Command executed: /${command} by ${user} in ${guild || 'DM'}`);
};

logger.event = (eventName, details = '') => {
  logger.info(`Event: ${eventName} ${details}`);
};

logger.database = (action, details = '') => {
  logger.debug(`Database: ${action} ${details}`);
};

logger.api = (method, endpoint, status) => {
  logger.info(`API: ${method} ${endpoint} - ${status}`);
};

// En développement, afficher plus de détails
if (config.env.isDevelopment) {
  logger.level = 'debug';
  logger.debug('Logger initialized in development mode');
}

export default logger;
