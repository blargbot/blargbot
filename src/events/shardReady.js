/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:25
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-13 10:46:44
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('shardReady', async function (id) {
    let shard = bot.shards.get(id);
    let data = { id, guilds: bot.guilds.filter(g => g.shard.id === shard.id).length, latency: shard.latency };
    bot.sender.send('shardReady', data);
});