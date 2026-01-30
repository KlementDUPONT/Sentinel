import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Afficher le menu d\'aide')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Nom de la commande pour obtenir plus d\'informations')
        .setRequired(false)
    ),

  category: 'utility',

  async execute(interaction) {
    const { client } = interaction;
    const commandName = interaction.options.getString('command');

    // Aide pour une commande spécifique
    if (commandName) {
      const command = client.commands.get(commandName.toLowerCase());

      if (!command) {
        return await interaction.reply({
          content: '❌ Cette commande n\'existe pas.',
          flags: 64
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📖 Aide: /' + command.data.name)
        .setDescription(command.data.description || 'Aucune description disponible')
        .addFields(
          {
            name: '📁 Catégorie',
            value: command.category || 'Aucune',
            inline: true
          },
          {
            name: '⏱️ Cooldown',
            value: (command.cooldown || 3) + ' secondes',
            inline: true
          }
        )
        .setFooter({
          text: 'Sentinel Bot • ' + new Date().toLocaleDateString('fr-FR'),
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      // Ajouter les options si elles existent
      if (command.data.options && command.data.options.length > 0) {
        const optionsText = command.data.options.map(opt => {
          const required = opt.required ? '**[Requis]**' : '[Optionnel]';
          return '`' + opt.name + '` ' + required + ' - ' + opt.description;
        }).join('\n');

        embed.addFields({
          name: '⚙️ Options',
          value: optionsText,
          inline: false
        });
      }

      return await interaction.reply({ embeds: [embed] });
    }

    // Menu d'aide général
    const categories = {};
    
    client.commands.forEach(cmd => {
      const category = cmd.category || 'Autre';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd);
    });

    const categoryEmojis = {
      admin: '⚙️',
      moderation: '🛡️',
      economy: '💰',
      fun: '🎮',
      utility: '🔧',
      levels: '📊'
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📚 Menu d\'aide - Sentinel Bot')
      .setDescription('Utilisez `/help <commande>` pour plus d\'informations sur une commande spécifique.')
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({
        text: 'Sentinel Bot • Version alpha.2',
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();

    // Ajouter chaque catégorie
    for (const [category, commands] of Object.entries(categories)) {
      const emoji = categoryEmojis[category.toLowerCase()] || '📁';
      const commandList = commands
        .map(cmd => '`/' + cmd.data.name + '`')
        .join(', ');

      embed.addFields({
        name: emoji + ' ' + category.charAt(0).toUpperCase() + category.slice(1),
        value: commandList || 'Aucune commande',
        inline: false
      });
    }

    // Menu déroulant pour naviguer
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('📂 Choisir une catégorie')
      .addOptions(
        Object.keys(categories).map(category => ({
          label: category.charAt(0).toUpperCase() + category.slice(1),
          description: categories[category].length + ' commande(s)',
          value: category,
          emoji: categoryEmojis[category.toLowerCase()] || '📁'
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  },
};
