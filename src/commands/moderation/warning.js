import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Afficher les avertissements d\'un utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L\'utilisateur dont il faut voir les avertissements')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  category: 'moderation',
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  botPermissions: [],

  async execute(interaction) {
    const { client, guild } = interaction;
    const target = interaction.options.getUser('user');

    try {
      // Récupérer tous les warns
      const allWarns = client.db.getWarns(target.id, guild.id);
      const activeWarns = allWarns.filter(w => w.active === 1);
      const inactiveWarns = allWarns.filter(w => w.active === 0);

      if (allWarns.length === 0) {
        return await interaction.reply({
          content: `✅ ${target} n'a aucun avertissement.`,
          flags: 64
        });
      }

      // Construire l'embed
      const embed = {
        color: activeWarns.length > 0 ? 0xff0000 : 0x00ff00,
        title: `⚠️ Avertissements de ${target.tag}`,
        description: `**${activeWarns.length}** avertissement${activeWarns.length > 1 ? 's' : ''} actif${activeWarns.length > 1 ? 's' : ''}`,
        fields: [],
        footer: {
          text: `Sentinel Bot • ${new Date().toLocaleDateString('fr-FR')}`,
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      // Ajouter les warns actifs
      if (activeWarns.length > 0) {
        for (const warn of activeWarns.slice(0, 10)) { // Limite à 10 pour pas dépasser
          const moderator = await client.users.fetch(warn.moderator_id).catch(() => null);
          const date = new Date(warn.created_at).toLocaleDateString('fr-FR');
          
          embed.fields.push({
            name: `⚠️ Warn #${warn.id} - ${date}`,
            value: `**Raison:** ${warn.reason}\n**Modérateur:** ${moderator ? moderator.tag : 'Inconnu'}`,
            inline: false
          });
        }

        if (activeWarns.length > 10) {
          embed.fields.push({
            name: '📊 Plus d\'avertissements',
            value: `... et ${activeWarns.length - 10} autre${activeWarns.length - 10 > 1 ? 's' : ''} avertissement${activeWarns.length - 10 > 1 ? 's' : ''}`,
            inline: false
          });
        }
      }

      // Ajouter stats des warns supprimés
      if (inactiveWarns.length > 0) {
        embed.fields.push({
          name: '🗑️ Historique',
          value: `${inactiveWarns.length} avertissement${inactiveWarns.length > 1 ? 's' : ''} supprimé${inactiveWarns.length > 1 ? 's' : ''}`,
          inline: false
        });
      }

      // Créer les boutons d'action
      const buttons = new ActionRowBuilder();

      if (activeWarns.length > 0) {
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId(`clearwarns_${target.id}`)
            .setLabel('Supprimer tous les warns')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
        );
      }

      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`refresh_warnings_${target.id}`)
          .setLabel('Actualiser')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary)
      );

      const messageOptions = { embeds: [embed] };
      if (buttons.components.length > 0) {
        messageOptions.components = [buttons];
      }

      await interaction.reply(messageOptions);

    } catch (error) {
      console.error('Erreur dans warnings:', error);
      
      const errorMsg = {
        content: '❌ Une erreur est survenue lors de la récupération des avertissements.',
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
