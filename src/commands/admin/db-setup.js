import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('db-setup')
    .setDescription('Setup verification system in database (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'admin',

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const db = interaction.client.db;

      if (!db) {
        return interaction.editReply('❌ Database handler is not available.');
      }

      // Récupérer ou créer la guild
      let guildData = db.getGuild(interaction.guildId);
      
      if (!guildData) {
        db.createGuild(interaction.guildId, interaction.guild.name);
        guildData = db.getGuild(interaction.guildId);
      }

      // Vérifier si les colonnes existent déjà
      const hasVerificationChannel = 'verification_channel' in guildData;
      const hasVerificationRole = 'verification_role' in guildData;

      const embed = new EmbedBuilder()
        .setColor(hasVerificationChannel && hasVerificationRole ? '#00FF00' : '#FFA500')
        .setTitle('🔧 Database Setup')
        .setDescription('Verification system database check:')
        .addFields(
          { 
            name: 'Verification Channel Column', 
            value: hasVerificationChannel ? '✅ Exists' : '⚠️ Missing (will be created on first setup)', 
            inline: true 
          },
          { 
            name: 'Verification Role Column', 
            value: hasVerificationRole ? '✅ Exists' : '⚠️ Missing (will be created on first setup)', 
            inline: true 
          }
        )
        .setFooter({ text: 'Next step: Use /setup-verification' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in db-setup:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred during database setup.')
        .addFields({ name: 'Error', value: error.message })
        .setTimestamp();
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  }
};
