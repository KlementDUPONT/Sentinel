import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-verification')
    .setDescription('Configure the verification system')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Verification channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Role to give after verification')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'admin',

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');

      // Vérifier que le bot peut gérer le rôle
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: '❌ I cannot manage this role as it is higher than my highest role.',
          ephemeral: true
        });
      }

      // Vérifier que le rôle n'est pas @everyone
      if (role.id === interaction.guild.id) {
        return interaction.reply({
          content: '❌ You cannot use @everyone as verification role.',
          ephemeral: true
        });
      }

      const db = interaction.client.db;
      
      if (!db) {
        return interaction.reply({
          content: '❌ Database is not available.',
          ephemeral: true
        });
      }

      // Utiliser la méthode existante updateGuildConfig
      db.updateGuildConfig(interaction.guildId, {
        verification_channel: channel.id,
        verification_role: role.id
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Verification System Configured')
        .setDescription('The verification system has been set up successfully!')
        .addFields(
          { name: '📌 Verification Channel', value: `${channel}`, inline: true },
          { name: '🎭 Verification Role', value: `${role}`, inline: true }
        )
        .setFooter({ text: `Configured by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in setup-verification:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while setting up verification.')
        .addFields({ name: 'Error', value: error.message })
        .setTimestamp();
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
