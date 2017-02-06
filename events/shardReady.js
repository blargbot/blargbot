bot.on('shardReady', async function(id) {
    let shard = bot.shards.get(id);
    logger.shard(`${id} Ready! G:${shard.guildCount}`);
});