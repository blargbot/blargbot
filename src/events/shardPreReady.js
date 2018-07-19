/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:23:17
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-06-28 10:58:45
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('shardPreReady', async function (id) {
    console.shardi(`[${id}] Pre-Ready!`);
});