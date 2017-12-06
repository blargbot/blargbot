/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:34
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:23:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('shardResume', async function (id) {
    let shard = bot.shards.get(id);
    console.info(`${id} Resumed! G:${shard.guildCount}`);
});