import { PermissionFlagsBits } from 'discord.js';
import { PERMISSIONS, MODERATOR_PERMISSIONS, ADMIN_PERMISSIONS } from './constants.js';

/**
 * Système de gestion des permissions
 */

class PermissionManager {
  /**
   * Vérifie si un membre a une permission spécifique
   */
  static hasPermission(member, permission) {
    if (!member || !member.permissions) return false;
    return member.permissions.has(PermissionFlagsBits[permission]);
  }

  /**
   * Vérifie si un membre a toutes les permissions requises
   */
  static hasPermissions(member, permissions) {
    if (!member || !member.permissions) return false;
    return permissions.every(permission => 
      member.permissions.has(PermissionFlagsBits[permission])
    );
  }

  /**
   * Vérifie si un membre est administrateur
   */
  static isAdmin(member) {
    if (!member || !member.permissions) return false;
    return member.permissions.has(PermissionFlagsBits.Administrator);
  }

  /**
   * Vérifie si un membre est modérateur
   */
  static isModerator(member) {
    if (!member || !member.permissions) return false;
    
    return MODERATOR_PERMISSIONS.some(permission =>
      member.permissions.has(PermissionFlagsBits[permission])
    ) || this.isAdmin(member);
  }

  /**
   * Vérifie si un membre peut effectuer une action sur un autre membre
   */
  static canModerate(moderator, target) {
    // Le bot ne peut pas modérer
    if (!moderator || !target) return false;

    // Le propriétaire peut tout faire
    if (moderator.id === moderator.guild.ownerId) return true;

    // On ne peut pas se modérer soi-même
    if (moderator.id === target.id) return false;

    // Les bots ne peuvent pas être modérés par des membres normaux
    if (target.user.bot && !this.isAdmin(moderator)) return false;

    // Vérification de la hiérarchie des rôles
    const modHighestRole = moderator.roles.highest;
    const targetHighestRole = target.roles.highest;

    if (!modHighestRole || !targetHighestRole) return false;

    return modHighestRole.position > targetHighestRole.position;
  }

  /**
   * Vérifie si le bot peut effectuer une action sur un membre
   */
  static botCanModerate(bot, target) {
    if (!bot || !target) return false;

    // Le propriétaire ne peut pas être modéré
    if (target.id === target.guild.ownerId) return false;

    // Vérification de la hiérarchie
    const botHighestRole = bot.roles.highest;
    const targetHighestRole = target.roles.highest;

    if (!botHighestRole || !targetHighestRole) return false;

    return botHighestRole.position > targetHighestRole.position;
  }

  /**
   * Obtient les permissions manquantes
   */
  static getMissingPermissions(member, requiredPermissions) {
    if (!member || !member.permissions) return requiredPermissions;

    return requiredPermissions.filter(permission =>
      !member.permissions.has(PermissionFlagsBits[permission])
    );
  }

  /**
   * Formatte les permissions pour l'affichage
   */
  static formatPermissions(permissions) {
    return permissions.map(perm => `\`${perm}\``).join(', ');
  }

  /**
   * Vérifie les permissions du bot
   */
  static botHasPermissions(guild, permissions) {
    const botMember = guild.members.me;
    if (!botMember) return false;

    return permissions.every(permission =>
      botMember.permissions.has(PermissionFlagsBits[permission])
    );
  }

  /**
   * Vérifie les permissions dans un canal spécifique
   */
  static hasChannelPermission(member, channel, permission) {
    if (!member || !channel) return false;
    return channel.permissionsFor(member)?.has(PermissionFlagsBits[permission]) ?? false;
  }

  /**
   * Vérifie si le bot a les permissions dans un canal
   */
  static botHasChannelPermissions(channel, permissions) {
    if (!channel || !channel.guild) return false;
    const botMember = channel.guild.members.me;
    if (!botMember) return false;

    return permissions.every(permission =>
      channel.permissionsFor(botMember)?.has(PermissionFlagsBits[permission]) ?? false
    );
  }
}

export default PermissionManager;
