import logger from '../../utils/logger.js';

export default {
    name: 'messageCreate',
    category: 'message',

    async execute(message) {
        // Ignorer les messages des bots et les messages privés (DMs)
        if (message.author.bot || !message.guild) return;

        try {
            // Le système d'XP a été désactivé en v2.0.1-beta.1 pour améliorer les performances.
            // Cet événement reste disponible pour de futures logiques globales (ex: auto-modération).

            return;
        } catch (error) {
            logger.error('Error in messageCreate event:', error.message);
        }
    }
};