bot.on('shardDisconnect', async function(err, id) {
    if (err) {
        logger.error(`[SHARD ${id}] Disconnected: ${err.stack}`);
    } else {
        logger.shard(`${id} Disconnected!`);
    }
});