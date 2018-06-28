/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:25
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-28 10:58:40
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('shardReady', async function (id) {
    let shard = bot.shards.get(id);
    console.shardi(`[${id}] Ready! G:${bot.guilds.filter(g => g.shard.id === shard.id).length} P:${shard.latency}ms`);
});