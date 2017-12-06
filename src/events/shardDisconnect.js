/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:11
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:23:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('shardDisconnect', async function (err, id) {
    if (err) {
        console.error(`[SHARD ${id}] Disconnected: ${err.stack}`);
    } else {
        console.info(`${id} Disconnected!`);
    }
});