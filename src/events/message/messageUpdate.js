import { EmbedBuilder } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
    name: 'messageUpdate',
    category: 'message',

    async execute(oldMessage, newMessage) {
        if (oldMessage.partial || oldMessage.author?.bot || !oldMessage.guild) return;
        if (oldMessage.content === newMessage.content) return; // Ignore les changements d'embeds/liens

        try {
            const db = oldMessage.client.db;
            const guildData = db.getGuild(oldMessage.guild.id);

            if (!guildData?.log_channel) return;

            const logChannel = oldMessage.guild.channels.cache.get(guildData.log_channel);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('📝 Message Edited')
                .setAuthor({ name: oldMessage.author.tag, iconURL: oldMessage.author.displayAvatarURL() })
                .addFields(
                    { name: 'Before', value: oldMessage.content.slice(0, 1024) || '*Empty*' },
                    { name: 'After', value: newMessage.content.slice(0, 1024) || '*Empty*' },
                    { name: 'Channel', value: oldMessage.channel.toString(), inline: true }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            logger.error('Error in messageUpdate log:', error);
        }
    }
};