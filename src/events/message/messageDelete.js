import { EmbedBuilder } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
    name: 'messageDelete',
    category: 'message',

    async execute(message) {
        if (message.partial || message.author?.bot || !message.guild) return;

        try {
            const db = message.client.db;
            const guildData = db.getGuild(message.guild.id);

            if (!guildData?.log_channel) return;

            const logChannel = message.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#FF4B4B')
                .setTitle('🗑️ Message Deleted')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(`**Content:**\n${message.content || '*No text content (image or embed)*'}`)
                .addFields(
                    { name: 'Channel', value: message.channel.toString(), inline: true },
                    { name: 'Author ID', value: `\`${message.author.id}\``, inline: true }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            logger.error('Error in messageDelete log:', error);
        }
    }
};