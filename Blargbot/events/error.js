const error = true;

bot.on('error', function(err, id) {
    if (error && err.message.indexOf('Message.guild') == -1)
        logger.error(`[${id}] ${err.stack}`);
});