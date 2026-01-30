import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

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

      // Générer un code aléatoire de 6 caractères
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let verificationCode = '';
      for (let i = 0; i < 6; i++) {
        verificationCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Créer l'embed de vérification
      const verifyEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔒 Verification Required')
        .setDescription(`To verify that you are human, please type the following code:\n\n\`\`\`${verificationCode}\`\`\`\n\nYou have **60 seconds** to enter the code.`)
        .setFooter({ text: 'Type the code exactly as shown (case insensitive)' })
        .setTimestamp();

      await interaction.reply({
        embeds: [verifyEmbed],
        flags: 64 // Ephemeral (seulement visible par l'utilisateur)
      });

      console.log(`[VERIFY] User ${interaction.user.tag} needs to type: ${verificationCode}`);

      // Créer un collector pour les messages
      const filter = m => {
        // Vérifier que c'est le bon utilisateur
        return m.author.id === interaction.user.id;
      };

      const collector = interaction.channel.createMessageCollector({ 
        filter, 
        time: 60000, // 60 secondes
        max: 1 // Accepter seulement 1 message
      });

      collector.on('collect', async (message) => {
        console.log(`[VERIFY] User ${message.author.tag} typed: ${message.content}`);

        // Supprimer le message de l'utilisateur pour garder le salon propre
        try {
          await message.delete();
        } catch (err) {
          console.log('[VERIFY] Could not delete user message (missing permissions)');
        }

        // Vérifier si le code est correct (case insensitive)
        if (message.content.toUpperCase() === verificationCode) {
          console.log('[VERIFY] Code is CORRECT!');

          try {
            const role = interaction.guild.roles.cache.get(verificationConfig.verification_role);
            
            if (!role) {
              console.error(`[VERIFY] Role not found: ${verificationConfig.verification_role}`);
              return interaction.followUp({
                content: '❌ Verification role not found. Please contact an admin.',
                flags: 64
              });
            }

            console.log(`[VERIFY] Role found: ${role.name} (${role.id})`);
            console.log(`[VERIFY] Bot highest role position: ${interaction.guild.members.me.roles.highest.position}`);
            console.log(`[VERIFY] Target role position: ${role.position}`);

            // Vérifier la hiérarchie des rôles
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
              console.error(`[VERIFY] Bot role too low!`);
              return interaction.followUp({
                content: '❌ I cannot assign this role because it is higher than my highest role.\n\n**Admin:** Move my role above the verification role in Server Settings → Roles.',
                flags: 64
              });
            }

            // Vérifier les permissions
            if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
              console.error(`[VERIFY] Missing ManageRoles permission!`);
              return interaction.followUp({
                content: '❌ I do not have the "Manage Roles" permission.\n\n**Admin:** Give me this permission in Server Settings.',
                flags: 64
              });
            }

            console.log(`[VERIFY] Adding role to ${member.user.tag}...`);
            await member.roles.add(role);
            console.log(`[VERIFY] Role added successfully!`);

            const successEmbed = new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('✅ Verification Successful!')
              .setDescription(`Welcome ${member}! You now have access to the server.`)
              .setTimestamp();

            // Envoyer un message public de succès
            await interaction.channel.send({
              embeds: [successEmbed]
            });

          } catch (error) {
            console.error('[VERIFY] Error adding verification role:', error);
            await interaction.followUp({
              content: `❌ An error occurred:\n\`\`\`${error.message}\`\`\`\n\nPlease contact an admin.`,
              flags: 64
            });
          }
        } else {
          console.log('[VERIFY] Code is INCORRECT!');
          
          const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Verification Failed')
            .setDescription('The code you entered is incorrect.\n\nPlease run `/verify` again to get a new code.')
            .setTimestamp();

          await interaction.followUp({
            embeds: [errorEmbed],
            flags: 64
          });
        }
      });

      collector.on('end', (collected, reason) => {
        console.log(`[VERIFY] Collector ended: reason=${reason}, collected=${collected.size}`);
        
        if (reason === 'time' && collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⏱️ Verification Expired')
            .setDescription('You did not enter the code in time.\n\nPlease run `/verify` again.')
            .setTimestamp();

          interaction.followUp({
            embeds: [timeoutEmbed],
            flags: 64
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
