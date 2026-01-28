import { InteractionType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
  name: 'interactionCreate',
  category: 'client',

  async execute(interaction) {
    try {
      if (interaction.type === InteractionType.ApplicationCommand) {
        await handleCommand(interaction);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
      }
    } catch (error) {
      logger.error('Error in interactionCreate event:', error);
      
      const errorMessage = {
        content: '❌ Une erreur est survenue lors du traitement de cette interaction.',
        flags: 64
      };

      try {
        if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else if (!interaction.replied) {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        logger.error('Failed to send error message:', replyError);
      }
    }
  }
};

async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    return await interaction.reply({
      content: '❌ Cette commande n\'existe pas.',
      flags: 64
    });
  }

  try {
    // Check if command is enabled
    if (command.enabled === false) {
      return await interaction.reply({
        content: '❌ Cette commande est actuellement désactivée.',
        flags: 64
      });
    }

    // Check if command is owner only
    if (command.ownerOnly && interaction.user.id !== interaction.client.config.ownerId) {
      return await interaction.reply({
        content: '❌ Cette commande est réservée au propriétaire du bot.',
        flags: 64
      });
    }

    // Check if command is guild only
    if (command.guildOnly && !interaction.guild) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être utilisée qu\'en serveur.',
        flags: 64
      });
    }

    // Check cooldown
    const cooldownKey = `${interaction.commandName}-${interaction.user.id}`;
    const now = Date.now();
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (interaction.client.cooldowns.has(cooldownKey)) {
      const expirationTime = interaction.client.cooldowns.get(cooldownKey) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return await interaction.reply({
          content: `⏰ Veuillez attendre ${timeLeft.toFixed(1)} seconde(s) avant de réutiliser \`${interaction.commandName}\`.`,
          flags: 64
        });
      }
    }

    // Check bot permissions
    if (command.botPermissions && interaction.guild) {
      const botMember = interaction.guild.members.me;
      const missingPerms = botMember.permissions.missing(command.botPermissions);

      if (missingPerms.length > 0) {
        return await interaction.reply({
          content: `❌ Je n'ai pas les permissions nécessaires: \`${missingPerms.join(', ')}\``,
          flags: 64
        });
      }
    }

    // Check user permissions
    if (command.userPermissions && interaction.guild) {
      if (!interaction.member || !interaction.member.permissions) {
        return await interaction.reply({
          content: '❌ Impossible de vérifier vos permissions.',
          flags: 64
        });
      }

      const missingPerms = interaction.member.permissions.missing(command.userPermissions);

      if (missingPerms.length > 0) {
        return await interaction.reply({
          content: `❌ Vous n'avez pas les permissions nécessaires: \`${missingPerms.join(', ')}\``,
          flags: 64
        });
      }
    }

    // Set cooldown
    interaction.client.cooldowns.set(cooldownKey, now);
    setTimeout(() => interaction.client.cooldowns.delete(cooldownKey), cooldownAmount);

    // Execute command
    await command.execute(interaction);

    // Log command execution
    logger.info(
      `Command executed: /${interaction.commandName} by ${interaction.user.tag} in ${
        interaction.guild ? interaction.guild.name : 'DM'
      }`
    );

  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    logger.error(`❌ Command Error [${interaction.commandName}]:`, {
      user: `${interaction.user.tag} (${interaction.user.id})`,
      guild: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM',
      error: error.message
    });

    const errorMessage = {
      content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
      flags: 64
    };

    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else if (!interaction.replied) {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleButton(interaction) {
  const { customId, client, guild, user } = interaction;
  const [action, ...args] = customId.split('_');
  
  logger.info(`Button clicked: ${customId} by ${user.tag}`);

  try {
    // Gestion des boutons de warnings
    if (action === 'clearwarns' || (action === 'refresh' && args[0] === 'warnings')) {
      await handleWarningButtons(interaction);
      return;
    }

    // Handle button interactions existantes
    switch (action) {
      case 'help':
        await handleHelpButton(interaction, args);
        break;
      case 'ticket':
        await handleTicketButton(interaction, args);
        break;
      default:
        await interaction.reply({
          content: '❌ Bouton non reconnu.',
          flags: 64
        });
    }
  } catch (error) {
    logger.error('Error handling button:', error);
    
    const errorMsg = {
      content: '❌ Une erreur est survenue.',
      flags: 64
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMsg);
    } else {
      await interaction.reply(errorMsg);
    }
  }
}

async function handleWarningButtons(interaction) {
  const { customId, client, guild, user } = interaction;

  // Vérifier les permissions
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return await interaction.reply({
      content: '❌ Vous n\'avez pas la permission d\'utiliser ce bouton.',
      flags: 64
    });
  }

  try {
    // Bouton "Supprimer tous les warns"
    if (customId.startsWith('clearwarns_')) {
      const targetId = customId.split('_')[1];
      const target = await client.users.fetch(targetId);

      const warns = client.db.getWarns(targetId, guild.id);
      const activeWarns = warns.filter(w => w.active === 1);

      if (activeWarns.length === 0) {
        return await interaction.reply({
          content: `ℹ️ ${target.tag} n'a aucun avertissement actif.`,
          flags: 64
        });
      }

      // Supprimer tous les warns
      const stmt = client.db.db.prepare(
        'UPDATE warns SET active = 0 WHERE user_id = ? AND guild_id = ? AND active = 1'
      );
      stmt.run(targetId, guild.id);

      await interaction.reply({
        content: `✅ ${activeWarns.length} avertissement${activeWarns.length > 1 ? 's' : ''} supprimé${activeWarns.length > 1 ? 's' : ''} pour ${target.tag}.`,
        flags: 64
      });

      // Mettre à jour le message
      const updatedEmbed = {
        color: 0x00ff00,
        title: `⚠️ Avertissements de ${target.tag}`,
        description: `✅ Tous les avertissements ont été supprimés par ${user.tag}`,
        footer: {
          text: `Sentinel Bot • ${new Date().toLocaleDateString('fr-FR')}`,
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      await interaction.message.edit({ 
        embeds: [updatedEmbed], 
        components: [] 
      });

      // Log
      const guildData = client.db.getGuild(guild.id);
      if (guildData?.log_channel) {
        const logChannel = guild.channels.cache.get(guildData.log_channel);
        if (logChannel) {
          const logEmbed = {
            color: 0xffa500,
            title: '🗑️ Avertissements supprimés (bouton)',
            fields: [
              {
                name: '👤 Utilisateur',
                value: `${target.tag} (${targetId})`,
                inline: true
              },
              {
                name: '👮 Modérateur',
                value: `${user.tag} (${user.id})`,
                inline: true
              },
              {
                name: '📊 Nombre',
                value: `${activeWarns.length} warn${activeWarns.length > 1 ? 's' : ''}`,
                inline: true
              }
            ],
            timestamp: new Date().toISOString()
          };

          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    }

    // Bouton "Actualiser"
    if (customId.startsWith('refresh_warnings_')) {
      const targetId = customId.split('_')[2];
      const target = await client.users.fetch(targetId);

      const allWarns = client.db.getWarns(targetId, guild.id);
      const activeWarns = allWarns.filter(w => w.active === 1);
      const inactiveWarns = allWarns.filter(w => w.active === 0);

      if (allWarns.length === 0) {
        return await interaction.update({
          content: `✅ ${target.tag} n'a aucun avertissement.`,
          embeds: [],
          components: []
        });
      }

      const embed = {
        color: activeWarns.length > 0 ? 0xff0000 : 0x00ff00,
        title: `⚠️ Avertissements de ${target.tag}`,
        description: `**${activeWarns.length}** avertissement${activeWarns.length > 1 ? 's' : ''} actif${activeWarns.length > 1 ? 's' : ''}`,
        fields: [],
        footer: {
          text: `Sentinel Bot • Actualisé à ${new Date().toLocaleTimeString('fr-FR')}`,
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      if (activeWarns.length > 0) {
        for (const warn of activeWarns.slice(0, 10)) {
          const moderator = await client.users.fetch(warn.moderator_id).catch(() => null);
          const date = new Date(warn.created_at).toLocaleDateString('fr-FR');
          
          embed.fields.push({
            name: `⚠️ Warn #${warn.id} - ${date}`,
            value: `**Raison:** ${warn.reason}\n**Modérateur:** ${moderator ? moderator.tag : 'Inconnu'}`,
            inline: false
          });
        }
      }

      if (inactiveWarns.length > 0) {
        embed.fields.push({
          name: '🗑️ Historique',
          value: `${inactiveWarns.length} avertissement${inactiveWarns.length > 1 ? 's' : ''} supprimé${inactiveWarns.length > 1 ? 's' : ''}`,
          inline: false
        });
      }

      const buttons = new ActionRowBuilder();
      if (activeWarns.length > 0) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId(`clearwarns_${targetId}`)
            .setLabel('Supprimer tous les warns')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
        );
      }

      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`refresh_warnings_${targetId}`)
          .setLabel('Actualiser')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ 
        embeds: [embed], 
        components: [buttons]
      });
    }

  } catch (error) {
    logger.error('Erreur handleWarningButtons:', error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Une erreur est survenue.',
        flags: 64
      });
    } else {
      await interaction.reply({
        content: '❌ Une erreur est survenue.',
        flags: 64
      });
    }
  }
}

async function handleSelectMenu(interaction) {
  const [action] = interaction.customId.split('_');
  
  logger.info(`Select menu used: ${interaction.customId} by ${interaction.user.tag}`);

  // Handle select menu interactions
  switch (action) {
    case 'help':
      await handleHelpSelect(interaction);
      break;
    default:
      await interaction.reply({
        content: '❌ Menu non reconnu.',
        flags: 64
      });
  }
}

async function handleModal(interaction) {
  const [action] = interaction.customId.split('_');
  
  logger.info(`Modal submitted: ${interaction.customId} by ${interaction.user.tag}`);

  // Handle modal submissions
  switch (action) {
    case 'ticket':
      await handleTicketModal(interaction);
      break;
    default:
      await interaction.reply({
        content: '❌ Modal non reconnu.',
        flags: 64
      });
  }
}

// Helper functions for interactions
async function handleHelpButton(interaction, args) {
  const category = args[0];
  const commands = interaction.client.commands;
  
  // Implementation for help button
  await interaction.deferUpdate();
}

async function handleHelpSelect(interaction) {
  const category = interaction.values[0];
  const commands = interaction.client.commands;
  
  // Implementation for help select menu
  await interaction.deferUpdate();
}

async function handleTicketButton(interaction, args) {
  // Implementation for ticket button
  await interaction.deferReply({ flags: 64 });
}

async function handleTicketModal(interaction) {
  // Implementation for ticket modal
  await interaction.deferReply({ flags: 64 });
}
