import { Events } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Commande Slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (err) {
                console.error(err);
                await interaction.reply({ content: 'Erreur commande.', ephemeral: true }).catch(() => {});
            }
        } 
        
        // Bouton de vérification
        else if (interaction.isButton() && interaction.customId === 'verify_user') {
            try {
                const data = interaction.client.db.getGuild(interaction.guild.id);
                if (!data?.verification_role) return interaction.reply({ content: 'Non configuré.', ephemeral: true });

                const role = interaction.guild.roles.cache.get(data.verification_role);
                if (!role) return interaction.reply({ content: 'Rôle introuvable.', ephemeral: true });

                await interaction.member.roles.add(role);
                await interaction.reply({ content: '✅ Vérifié !', ephemeral: true });
            } catch (err) {
                console.error(err);
                await interaction.reply({ content: 'Erreur (Vérifiez mes permissions/hiérarchie).', ephemeral: true }).catch(() => {});
            }
        }
    }
};