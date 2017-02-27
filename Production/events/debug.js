const debug = false;

bot.on('debug', function(message, id) {
    if (debug)
        logger.debug(`[${id}] ${message}`);
});