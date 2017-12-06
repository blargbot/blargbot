/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:11
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-06 10:39:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('shardDisconnect', async function (err, id) {
    if (err) {
        console.error(`Shard Disconnected: ${err.stack}`);
    } else {
        console.shardi(`Disconnected!`);
    }
});