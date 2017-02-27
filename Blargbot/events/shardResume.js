bot.on('shardResume', async function(id) {
    let shard = bot.shards.get(id);
    logger.shard(`${id} Resumed! G:${shard.guildCount}`);
});