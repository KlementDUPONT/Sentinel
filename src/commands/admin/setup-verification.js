import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

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

      // Sauvegarder dans la base de données
      const db = interaction.client.db;
      
      if (!db || !db.db) {
        return interaction.reply({
          content: '❌ Database is not available. Please contact an administrator.',
          ephemeral: true
        });
      }

      db.db.prepare(`
        UPDATE guilds 
        SET verification_channel = ?, verification_role = ? 
        WHERE guild_id = ?
      `).run(channel.id, role.id, interaction.guildId);

      await interaction.reply({
        content: `✅ Verification system configured!\n\n` +
                 `📌 **Channel:** ${channel}\n` +
                 `🎭 **Role:** ${role}\n\n` +
                 `Members who use \`/verify\` in ${channel} will receive the ${role} role.`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in setup-verification:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred while setting up verification.',
          ephemeral: true
        });
      }
    }
  }
};
