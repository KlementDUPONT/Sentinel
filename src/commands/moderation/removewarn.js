import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removewarn')
    .setDescription('Supprimer un avertissement spécifique')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur concerné')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('warn_id')
        .setDescription('L\'ID du warn à supprimer')
        .setRequired(true)
        .setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  category: 'moderation',
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  botPermissions: [],

  async execute(interaction) {
    const { client, guild, user } = interaction;
    const target = interaction.options.getUser('user');
    const warnId = interaction.options.getInteger('warn_id');

    try {
      // Vérifier que le warn existe
      const warn = client.db.db.prepare(
        'SELECT * FROM warns WHERE id = ? AND user_id = ? AND guild_id = ? AND active = 1'
      ).get(warnId, target.id, guild.id);

      if (!warn) {
        return await interaction.reply({
          content: `❌ Aucun avertissement actif avec l'ID **${warnId}** trouvé pour ${target}.`,
          flags: 64
        });
      }

      // Supprimer le warn
      client.db.db.prepare(
        'UPDATE warns SET active = 0 WHERE id = ?'
      ).run(warnId);

      // Récupérer le modérateur qui avait créé le warn
      const originalModerator = await client.users.fetch(warn.moderator_id).catch(() => null);

      // Embed de confirmation
      const embed = {
        color: 0x00ff00,
        title: '🗑️ Avertissement supprimé',
        description: `L'avertissement #${warnId} de ${target} a été supprimé.`,
        fields: [
          {
            name: '📝 Raison originale',
            value: warn.reason || 'Aucune raison',
            inline: false
          },
          {
            name: '👮 Créé par',
            value: originalModerator ? originalModerator.tag : 'Utilisateur inconnu',
            inline: true
          },
          {
            name: '📅 Date',
            value: new Date(warn.created_at).toLocaleDateString('fr-FR'),
            inline: true
          },
          {
            name: '🗑️ Supprimé par',
            value: user.tag,
            inline: true
          }
        ],
        footer: {
          text: `Sentinel Bot • ${new Date().toLocaleDateString('fr-FR')}`,
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [embed] });

      // Log dans le salon de logs
      const guildData = client.db.getGuild(guild.id);
      if (guildData?.log_channel) {
        const logChannel = guild.channels.cache.get(guildData.log_channel);
        if (logChannel) {
          const logEmbed = {
            color: 0xffa500,
            title: '🗑️ Avertissement supprimé',
            fields: [
              {
                name: '👤 Utilisateur',
                value: `${target} (${target.id})`,
                inline: true
              },
              {
                name: '🆔 Warn ID',
                value: `#${warnId}`,
                inline: true
              },
              {
                name: '🗑️ Supprimé par',
                value: `${user} (${user.id})`,
                inline: true
              },
              {
                name: '📝 Raison originale',
                value: warn.reason || 'Aucune raison',
                inline: false
              }
            ],
            timestamp: new Date().toISOString()
          };

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      // Notification DM
      try {
        const dmEmbed = {
          color: 0x00ff00,
          title: '✅ Avertissement supprimé',
          description: `Un de vos avertissements sur **${guild.name}** a été supprimé.`,
          fields: [
            {
              name: '📝 Raison originale',
              value: warn.reason || 'Aucune raison',
              inline: false
            }
          ],
          footer: {
            text: 'Sentinel Bot',
            icon_url: client.user.displayAvatarURL()
          },
          timestamp: new Date().toISOString()
        };

        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        // L'utilisateur a désactivé les DM
      }

    } catch (error) {
      console.error('Erreur dans removewarn:', error);
      
      const errorMsg = {
        content: '❌ Une erreur est survenue lors de la suppression de l\'avertissement.',
        flags: 64
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  },
};