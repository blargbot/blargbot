bot.on('shardPreReady', async function(id) {
    logger.shard(`${id} Pre-Ready!`);
});