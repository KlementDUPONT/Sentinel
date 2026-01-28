/**
 * Constantes globales du bot
 */

export const PERMISSIONS = {
  ADMINISTRATOR: 'Administrator',
  MANAGE_GUILD: 'ManageGuild',
  MANAGE_ROLES: 'ManageRoles',
  MANAGE_CHANNELS: 'ManageChannels',
  KICK_MEMBERS: 'KickMembers',
  BAN_MEMBERS: 'BanMembers',
  MANAGE_MESSAGES: 'ManageMessages',
  MODERATE_MEMBERS: 'ModerateMembers',
  SEND_MESSAGES: 'SendMessages',
  VIEW_CHANNEL: 'ViewChannel',
};

export const MODERATOR_PERMISSIONS = [
  PERMISSIONS.KICK_MEMBERS,
  PERMISSIONS.BAN_MEMBERS,
  PERMISSIONS.MANAGE_MESSAGES,
  PERMISSIONS.MODERATE_MEMBERS,
];

export const ADMIN_PERMISSIONS = [
  PERMISSIONS.ADMINISTRATOR,
  PERMISSIONS.MANAGE_GUILD,
];

export const TIMEOUTS = {
  COMMAND_COOLDOWN: 3000,        // 3 secondes
  INTERACTION_TIMEOUT: 15000,     // 15 secondes
  BUTTON_TIMEOUT: 60000,          // 1 minute
  MODAL_TIMEOUT: 300000,          // 5 minutes
  TICKET_CLOSE_DELAY: 5000,       // 5 secondes
};

export const LIMITS = {
  MAX_WARNS: 10,
  MAX_CLEAR_MESSAGES: 100,
  MAX_TICKETS_PER_USER: 3,
  MAX_GIVEAWAY_WINNERS: 20,
  MAX_POLL_OPTIONS: 10,
  MAX_SHOP_ITEMS: 50,
  XP_PER_MESSAGE: { min: 15, max: 25 },
  XP_COOLDOWN: 60000,             // 1 minute entre messages pour XP
  DAILY_COOLDOWN: 86400000,       // 24 heures
  WORK_COOLDOWN: 3600000,         // 1 heure
};

export const ECONOMY = {
  DEFAULT_CURRENCY: 'credits',
  DEFAULT_SYMBOL: '💰',
  DEFAULT_DAILY_AMOUNT: 100,
  DEFAULT_WORK_MIN: 50,
  DEFAULT_WORK_MAX: 150,
  STARTING_BALANCE: 0,
  MAX_BALANCE: 999999999,
};

export const LEVELS = {
  XP_MULTIPLIER: 100,              // XP requis = niveau * 100
  MAX_LEVEL: 100,
  ENABLE_NOTIFICATIONS: true,
};

export const EMBED_LIMITS = {
  TITLE: 256,
  DESCRIPTION: 4096,
  FIELDS: 25,
  FIELD_NAME: 256,
  FIELD_VALUE: 1024,
  FOOTER: 2048,
  AUTHOR: 256,
};

export const REGEX = {
  DISCORD_INVITE: /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/gi,
  URL: /(https?:\/\/[^\s]+)/gi,
  MENTION: /<@!?(\d+)>/g,
  ROLE_MENTION: /<@&(\d+)>/g,
  CHANNEL_MENTION: /<#(\d+)>/g,
  EMOJI: /<a?:\w+:(\d+)>/g,
};

export const TICKET_CATEGORIES = [
  { value: 'support', label: '🎫 Support Général', emoji: '🎫' },
  { value: 'report', label: '⚠️ Signalement', emoji: '⚠️' },
  { value: 'suggestion', label: '💡 Suggestion', emoji: '💡' },
  { value: 'partnership', label: '🤝 Partenariat', emoji: '🤝' },
  { value: 'other', label: '📋 Autre', emoji: '📋' },
];

export const MODERATION_ACTIONS = {
  BAN: 'ban',
  UNBAN: 'unban',
  KICK: 'kick',
  MUTE: 'mute',
  UNMUTE: 'unmute',
  WARN: 'warn',
  UNWARN: 'unwarn',
  TIMEOUT: 'timeout',
  UNTIMEOUT: 'untimeout',
  CLEAR: 'clear',
};

export const LOG_EMOJIS = {
  BAN: '🔨',
  UNBAN: '🔓',
  KICK: '👢',
  MUTE: '🔇',
  UNMUTE: '🔊',
  WARN: '⚠️',
  TIMEOUT: '⏱️',
  CLEAR: '🧹',
  JOIN: '📥',
  LEAVE: '📤',
  MESSAGE_DELETE: '🗑️',
  MESSAGE_EDIT: '✏️',
  ROLE_ADD: '➕',
  ROLE_REMOVE: '➖',
  CHANNEL_CREATE: '📝',
  CHANNEL_DELETE: '🔥',
};

export const RESPONSE_MESSAGES = {
  NO_PERMISSION: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
  BOT_NO_PERMISSION: '❌ Je n\'ai pas les permissions nécessaires pour effectuer cette action.',
  INVALID_USER: '❌ Utilisateur invalide ou introuvable.',
  INVALID_MEMBER: '❌ Membre invalide ou introuvable sur ce serveur.',
  CANNOT_ACTION_SELF: '❌ Vous ne pouvez pas effectuer cette action sur vous-même.',
  CANNOT_ACTION_BOT: '❌ Je ne peux pas effectuer cette action sur un bot.',
  HIERARCHY_ERROR: '❌ Je ne peux pas effectuer cette action sur ce membre (hiérarchie des rôles).',
  USER_HIERARCHY_ERROR: '❌ Vous ne pouvez pas effectuer cette action sur ce membre (hiérarchie des rôles).',
  ALREADY_BANNED: '❌ Cet utilisateur est déjà banni.',
  NOT_BANNED: '❌ Cet utilisateur n\'est pas banni.',
  COMMAND_ERROR: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
  COOLDOWN: '⏱️ Veuillez attendre {time} avant de réutiliser cette commande.',
  MAINTENANCE: '🔧 Cette fonctionnalité est actuellement en maintenance.',
  SUCCESS: '✅ Action effectuée avec succès.',
};

export const STATUS_ACTIVITIES = [
  { name: '{prefix}help | v{version}', type: 3 }, // Watching
  { name: '{guilds} serveurs', type: 3 },
  { name: '{users} utilisateurs', type: 3 },
  { name: 'Sentinel Alpha 🛡️', type: 0 },        // Playing
];

export default {
  PERMISSIONS,
  MODERATOR_PERMISSIONS,
  ADMIN_PERMISSIONS,
  TIMEOUTS,
  LIMITS,
  ECONOMY,
  LEVELS,
  EMBED_LIMITS,
  REGEX,
  TICKET_CATEGORIES,
  MODERATION_ACTIONS,
  LOG_EMOJIS,
  RESPONSE_MESSAGES,
  STATUS_ACTIVITIES,
};
