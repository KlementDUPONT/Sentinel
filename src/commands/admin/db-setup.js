import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('db-setup')
    .setDescription('Setup verification system columns (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'admin',

  async execute(interaction) {
    try {
      await interaction.reply({
        content: '⏳ Setting up database...',
        flags: 64
      });

      const db = interaction.client.db;

      if (!db || !db.addVerificationColumns) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('Database handler does not support verification columns.')
          .setTimestamp();
        
        return interaction.editReply({ content: null, embeds: [errorEmbed] });
      }

      // Ajouter les colonnes
      const success = db.addVerificationColumns();

      const embed = new EmbedBuilder()
        .setColor(success ? '#00FF00' : '#FF0000')
        .setTitle(success ? '✅ Database Setup Complete' : '❌ Setup Failed')
        .setDescription(success 
          ? 'Verification columns have been created successfully!\n\n**Next step:** Use `/setup-verification`'
          : 'Failed to create verification columns. Check bot logs for details.'
        )
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });

    } catch (error) {
      console.error('Error in db-setup:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred during setup.')
        .addFields({ name: 'Error', value: error.message })
        .setTimestamp();
      
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: null, embeds: [errorEmbed] });
      }
    }
  }
};
