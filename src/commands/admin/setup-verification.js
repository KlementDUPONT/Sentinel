import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setup-verification')
    .setDescription('Setup verif')
    .addChannelOption(o => o.setName('channel').setDescription('Salon').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Rôle').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    // 1. Réponse immédiate pour Discord
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');

    try {
        // 2. Enregistrement DB
        interaction.client.db.updateVerification(interaction.guild.id, channel.id, role.id);

        // 3. Envoi du message
        const embed = new EmbedBuilder().setTitle('Vérification').setDescription('Cliquez ci-dessous.').setColor('Green');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_user').setLabel('S\'enregistrer').setStyle(ButtonStyle.Success)
        );

        await channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply('✅ Installé avec succès.');
    } catch (err) {
        await interaction.editReply('❌ Erreur : ' + err.message);
    }
}