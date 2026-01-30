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
      const userId = interaction.user.id;

      const buttons = colors.map((color, index) => {
        return new ButtonBuilder()
          .setCustomId(`verify_${index === correctIndex ? 'correct' : 'wrong'}_${index}_${timestamp}_${userId}`)
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

      // Log pour debug
      console.log(`[VERIFY] User ${interaction.user.tag} (${userId}) started verification`);
      console.log(`[VERIFY] Timestamp: ${timestamp}`);
      console.log(`[VERIFY] Correct button: index ${correctIndex}`);

      // Créer un collector pour les boutons
      const filter = i => {
        const matches = i.customId.includes(timestamp.toString()) && i.customId.includes(userId);
        console.log(`[VERIFY] Button click from ${i.user.tag}: customId=${i.customId}, matches=${matches}`);
        return matches;
      };

      const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 60000, // 60 secondes
        max: 1
      });

      collector.on('collect', async i => {
        console.log(`[VERIFY] Collector triggered for ${i.user.tag}`);
        console.log(`[VERIFY] Button customId: ${i.customId}`);
        
        // Déférer immédiatement
        await i.deferUpdate();

        if (i.customId.includes('correct')) {
          console.log(`[VERIFY] Correct button clicked!`);
          
          try {
            const role = interaction.guild.roles.cache.get(verificationConfig.verification_role);
            
            if (!role) {
              console.error(`[VERIFY] Role not found: ${verificationConfig.verification_role}`);
              return interaction.editReply({
                content: '❌ Verification role not found. Please contact an admin.',
                components: []
              });
            }

            console.log(`[VERIFY] Role found: ${role.name} (${role.id})`);
            console.log(`[VERIFY] Bot highest role: ${interaction.guild.members.me.roles.highest.name} (position: ${interaction.guild.members.me.roles.highest.position})`);
            console.log(`[VERIFY] Target role position: ${role.position}`);

            // Vérifier si le bot peut gérer ce rôle
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
              console.error(`[VERIFY] Bot role too low! Bot: ${interaction.guild.members.me.roles.highest.position}, Target: ${role.position}`);
              return interaction.editReply({
                content: '❌ I cannot assign this role because it is higher than my highest role.\n\n**Admin:** Move my role above the verification role in Server Settings → Roles.',
                components: []
              });
            }

            // Vérifier les permissions
            const botPermissions = interaction.guild.members.me.permissions;
            if (!botPermissions.has('ManageRoles')) {
              console.error(`[VERIFY] Missing ManageRoles permission!`);
              return interaction.editReply({
                content: '❌ I do not have the "Manage Roles" permission.\n\n**Admin:** Give me this permission in Server Settings.',
                components: []
              });
            }

            console.log(`[VERIFY] Adding role to ${member.user.tag}...`);
            await member.roles.add(role);
            console.log(`[VERIFY] Role added successfully!`);
            
            await interaction.editReply({
              content: `✅ **Verification successful!**\n\nYou now have the ${role} role and access to the server.`,
              components: []
            });
          } catch (error) {
            console.error('[VERIFY] Error adding verification role:', error);
            await interaction.editReply({
              content: `❌ An error occurred while verifying you:\n\`\`\`${error.message}\`\`\`\n\nPlease contact an admin.`,
              components: []
            }).catch(() => {});
          }
        } else {
          console.log(`[VERIFY] Wrong button clicked!`);
          await interaction.editReply({
            content: '❌ **Verification failed!**\n\nYou clicked the wrong button. Please try `/verify` again.',
            components: []
          }).catch(() => {});
        }
      });

      collector.on('end', (collected, reason) => {
        console.log(`[VERIFY] Collector ended: reason=${reason}, collected=${collected.size}`);
        if (reason === 'time' && collected.size === 0) {
          interaction.editReply({
            content: '⏱️ **Verification expired!**\n\nPlease run `/verify` again.',
            components: []
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('[VERIFY] Error in verify command:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred during verification.',
          flags: 64
        }).catch(() => {});
      }
    }
  }
};
