const warn = true;

bot.on('warn', function(message, id) {
    if (warn)
        logger.warn(`[${id}] ${message}`);
});