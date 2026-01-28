import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transférer de l'argent à un autre utilisateur')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('L'utilisateur à payer')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Le montant à transférer')
        .setRequired(true)
        .setMinValue(1)
    ),

  category: 'economy',
  cooldown: 5,
  guildOnly: true,

  async execute(interaction) {
    const { client, guild, user } = interaction;
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    try {
      // Vérifications de base
      if (target.bot) {
        return await interaction.reply({
          content: '❌ Vous ne pouvez pas payer un bot.',
          flags: 64
        });
      }

      if (target.id === user.id) {
        return await interaction.reply({
          content: '❌ Vous ne pouvez pas vous payer vous-même.',
          flags: 64
        });
      }

      // Validation du montant
      if (amount <= 0) {
        return await interaction.reply({
          content: '❌ Le montant doit être supérieur à 0.',
          flags: 64
        });
      }

      if (amount > 999999999) {
        return await interaction.reply({
          content: '❌ Le montant est trop élevé (maximum : 999,999,999 🪙).',
          flags: 64
        });
      }

      // Récupérer les données des deux utilisateurs
      let senderData = client.db.getUser(user.id, guild.id);
      let targetData = client.db.getUser(target.id, guild.id);

      // Créer les utilisateurs s'ils n'existent pas
      if (!senderData) {
        client.db.createUser(user.id, guild.id);
        senderData = { balance: 0, bank: 0 };
      }

      if (!targetData) {
        client.db.createUser(target.id, guild.id);
        targetData = { balance: 0, bank: 0 };
      }

      // Vérifier que l'expéditeur a assez d'argent
      if (senderData.balance < amount) {
        return await interaction.reply({
          content: `❌ Vous n'avez pas assez d'argent. Vous avez **${senderData.balance.toLocaleString()} 🪙** et vous essayez de payer **${amount.toLocaleString()} 🪙**.`,
          flags: 64
        });
      }

      // Effectuer la transaction
      const newSenderBalance = senderData.balance - amount;
      const newTargetBalance = targetData.balance + amount;

      // Vérifier que le destinataire ne dépasse pas la limite
      if (newTargetBalance > 999999999) {
        return await interaction.reply({
          content: `❌ Cette transaction dépasserait la limite de balance de ${target.tag} (maximum : 999,999,999 🪙).`,
          flags: 64
        });
      }

      // Mettre à jour les balances
      client.db.updateUser(user.id, guild.id, { balance: newSenderBalance });
      client.db.updateUser(target.id, guild.id, { balance: newTargetBalance });

      // Confirmation avec embed
      const successEmbed = {
        color: 0x00ff00,
        title: '💸 Transaction réussie',
        description: `${user} a transféré **${amount.toLocaleString()} 🪙** à ${target}`,
        fields: [
          {
            name: '💰 Nouvelle balance',
            value: `Vous avez maintenant **${newSenderBalance.toLocaleString()} 🪙**`,
            inline: false
          }
        ],
        footer: {
          text: `Sentinel Bot • ${new Date().toLocaleDateString('fr-FR')}`,
          icon_url: client.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
      };

      await interaction.reply({ embeds: [successEmbed] });

      // Notification au destinataire (si possible)
      try {
        const dmEmbed = {
          color: 0x00ff00,
          title: '💰 Vous avez reçu de l'argent !',
          description: `${user.tag} vous a envoyé **${amount.toLocaleString()} 🪙** sur le serveur **${guild.name}**`,
          fields: [
            {
              name: '💵 Votre nouvelle balance',
              value: `**${newTargetBalance.toLocaleString()} 🪙**`,
              inline: false
            }
          ],
          footer: {
            text: 'Sentinel Bot',
            icon_url: client.user.displayAvatarURL()
          },
          timestamp: new Date().toISOString()
        };

        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        // L'utilisateur a désactivé les DM, on ignore silencieusement
      }

    } catch (error) {
      console.error('Erreur dans la commande pay:', error);

      const errorMessage = interaction.replied || interaction.deferred
        ? { content: '❌ Une erreur est survenue lors de la transaction.', flags: 64 }
        : { content: '❌ Une erreur est survenue lors de la transaction.', flags: 64 };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};
