/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:11
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-28 10:58:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('shardDisconnect', async function (err, id) {
    if (err) {
        console.error(`[${id}] Shard Disconnected: ${err.stack}`);
    } else {
        console.shardi(`[${id}] Disconnected!`);
    }
});