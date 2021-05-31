/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:42
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-11 11:21:00
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('guildDelete', async function (guild) {
    bu.postStats();
    bu.Metrics.guildGauge.dec();

    r.table('guild').get(guild.id).update({
        active: false
    }).run();
});