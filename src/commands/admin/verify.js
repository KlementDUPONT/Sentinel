import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify yourself to access the server'),

  category: 'admin',

  async execute(interaction) {
    try {
      const db = interaction.client.db;

      if (!db || !db.getVerification) {
        return interaction.reply({
          content: '❌ Verification system is not available.',
          flags: 64
        });
      }

      // Récupérer la config du serveur
      const verificationConfig = db.getVerification(interaction.guildId);

      if (!verificationConfig || !verificationConfig.verification_channel || !verificationConfig.verification_role) {
        return interaction.reply({
          content: '❌ Verification system is not configured on this server.\n\nAsk an admin to run `/db-setup` and `/setup-verification` first.',
          flags: 64
        });
      }

      // Vérifier si on est dans le bon salon
      if (interaction.channelId !== verificationConfig.verification_channel) {
        const channel = interaction.guild.channels.cache.get(verificationConfig.verification_channel);
        return interaction.reply({
          content: `❌ You can only verify yourself in ${channel || 'the verification channel'}.`,
          flags: 64
        });
      }

      // Vérifier si l'utilisateur a déjà le rôle
      const member = interaction.member;
      if (member.roles.cache.has(verificationConfig.verification_role)) {
        return interaction.reply({
          content: '✅ You are already verified!',
          flags: 64
        });
      }

      // Créer les boutons de vérification avec IDs UNIQUES
      const colors = ['🔴', '🔵', '🟢', '🟡'];
      const correctIndex = Math.floor(Math.random() * colors.length);
      const correctColor = colors[correctIndex];
      const timestamp = Date.now();

      const buttons = colors.map((color, index) => {
        return new ButtonBuilder()
          .setCustomId(`verify_${index === correctIndex ? 'correct' : 'wrong'}_${index}_${timestamp}_${interaction.user.id}`)
          .setLabel(color)
          .setStyle(index === correctIndex ? ButtonStyle.Success : ButtonStyle.Secondary);
      });

      // Mélanger les boutons
      buttons.sort(() => Math.random() - 0.5);

      const row = new ActionRowBuilder().addComponents(buttons);

      await interaction.reply({
        content: `🤖 **Verification**\n\nClick on the **${correctColor}** button to verify that you are human.`,
        components: [row],
        flags: 64
      });

      // Créer un collector pour les boutons
      const filter = i => {
        // Vérifier que c'est le bon user et que le customId contient le timestamp
        return i.user.id === interaction.user.id && i.customId.includes(timestamp.toString());
      };

      const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 30000,
        max: 1 // Accepter seulement 1 clic
      });

      collector.on('collect', async i => {
        // Déférer immédiatement pour éviter le timeout
        await i.deferUpdate();

        if (i.customId.includes('correct')) {
          try {
            const role = interaction.guild.roles.cache.get(verificationConfig.verification_role);
            
            if (!role) {
              return interaction.editReply({
                content: '❌ Verification role not found. Please contact an admin.',
                components: []
              });
            }

            await member.roles.add(role);
            
            await interaction.editReply({
              content: '✅ **Verification successful!**\n\nYou now have access to the server.',
              components: []
            });
          } catch (error) {
            console.error('Error adding verification role:', error);
            await interaction.editReply({
              content: '❌ An error occurred while verifying you. Please contact an admin.',
              components: []
            }).catch(() => {});
          }
        } else {
          await interaction.editReply({
            content: '❌ **Verification failed!**\n\nYou clicked the wrong button. Please try `/verify` again.',
            components: []
          }).catch(() => {});
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          interaction.editReply({
            content: '⏱️ **Verification expired!**\n\nPlease run `/verify` again.',
            components: []
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error in verify:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred during verification.',
          flags: 64
        }).catch(() => {});
      }
    }
  }
};
