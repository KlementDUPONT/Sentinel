import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Supprimer tous les avertissements d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur dont il faut supprimer les warns')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  category: 'moderation',
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  botPermissions: [],

  async execute(interaction) {
    const { client, guild, user } = interaction;
    const target = interaction.options.getUser('user');

    try {
      // Récupérer tous les warns actifs
      const warns = client.db.getWarns(target.id, guild.id);
      const activeWarns = warns.filter(w => w.active === 1);

      if (activeWarns.length === 0) {
        return await interaction.reply({
          content: `ℹ️ ${target} n'a aucun avertissement actif.`,
          flags: 64
        });
      }

      // Désactiver tous les warns
      const stmt = client.db.db.prepare(
        'UPDATE warns SET active = 0 WHERE user_id = ? AND guild_id = ? AND active = 1'
      );
      stmt.run(target.id, guild.id);

      // Embed de confirmation
      const embed = {
        color: 0x00ff00,
        title: '🗑️ Avertissements supprimés',
        description: `Tous les avertissements de ${target} ont été supprimés.`,
        fields: [
          {
            name: '📊 Statistiques',
            value: `**${activeWarns.length}** avertissement${activeWarns.length > 1 ? 's' : ''} supprimé${activeWarns.length > 1 ? 's' : ''}`,
            inline: false
          },
          {
            name: '👤 Utilisateur',
            value: target.tag,
            inline: true
          },
          {
            name: '👮 Modérateur',
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
            title: '🗑️ Avertissements supprimés',
            fields: [
              {
                name: '👤 Utilisateur',
                value: `${target} (${target.id})`,
                inline: true
              },
              {
                name: '👮 Modérateur',
                value: `${user} (${user.id})`,
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

      // Notification DM à l'utilisateur
      try {
        const dmEmbed = {
          color: 0x00ff00,
          title: '✅ Avertissements supprimés',
          description: `Tous vos avertissements sur **${guild.name}** ont été supprimés par un modérateur.`,
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
      console.error('Erreur dans clearwarns:', error);
      
      const errorMsg = {
        content: '❌ Une erreur est survenue lors de la suppression des avertissements.',
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