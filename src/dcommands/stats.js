const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');

function pad(value, length) {
    return (value.toString().length < length) ? pad(' ' + value, length) : value;
}

function compareStats(a, b) {
    if (a[1] < b[1])
        return 1;
    if (a[1] > b[1])
        return -1;
    return 0;
}

class StatsCommand extends BaseCommand {
    constructor() {
        super({
            name: 'stats',
            category: bu.CommandType.GENERAL,
            usage: 'stats [c]',
            info: 'Gives you some information about me'
        });
    }

    async execute(msg, words, text) {
        let full = words[1] && words[1].toLowerCase().startsWith('c');
        let sum = await r.table('stats').sum('uses').run();
        let stats = await r.table('stats').orderBy({
            index: r.desc('uses')
        }).limit(6).run();

        let topCommandsSession = '';
        var sortable = [];
        for (let name in bu.commandStats)
            sortable.push([name, bu.commandStats[name]]);
        sortable.sort(compareStats);
        for (let i = 0; i < sortable.length && i < 6; i++) {
            topCommandsSession += pad(sortable[i][0] + ':', 13) + ' ' + sortable[i][1] + '\n';
        }
        let embeds = {
            color: bu.avatarColours[bu.avatarId],
            timestamp: moment(),
            description: 'Bot Statistics',
            footer: {
                text: 'blargbot',
                icon_url: 'https://blargbot.xyz/img/blargbot.png'
            },
            fields: []
        };
        if (!full) {
            embeds.fields = [{
                name: 'Guilds',
                value: '' + bot.guilds.size,
                inline: true
            }, {
                name: 'Channels',
                value: '' + Object.keys(bot.channelGuildMap).length,
                inline: true
            }, {
                name: 'Users',
                value: '' + bot.users.size,
                inline: true
            }, {
                name: 'RAM',
                value: bu.getMemoryUsage() + 'MiB',
                inline: true
            }, {
                name: 'Version',
                value: '' + (await bu.getVersion()),
                inline: true
            }, {
                name: 'Uptime',
                value: '' + bu.createTimeDiffString(moment(), bu.startTime),
                inline: true
            }, {
                name: 'Messages',
                value: '' + bu.messageStats,
                inline: true
            }, {
                name: 'Per Minute',
                value: '' + Math.floor(bu.messageStats / moment.duration(moment() - bu.startTime).asMinutes() * 100) / 100,
                inline: true
            }, {
                name: 'Command Used This Session',
                value: '' + bu.commandUses,
                inline: true
            }, {
                name: 'Commands Per Minute',
                value: '' + Math.floor(bu.commandUses / moment.duration(moment() - bu.startTime).asMinutes() * 100) / 100,
                inline: true
            }, {
                name: 'Cleverbots Used This Session',
                value: '' + bu.cleverbotStats,
                inline: true
            }, {
                name: 'Total Commands Used',
                value: '' + sum,
                inline: true
            }];
        } else {
            embeds.fields.push({
                name: 'Top 6 Commands',
                value: 'This session',
                inline: false
            });
            let i = 0;
            for (let item of sortable) {
                embeds.fields.push({
                    name: item[0],
                    value: '' + item[1],
                    inline: true
                });
                i++;
                if (i >= 6) break;
            }

            embeds.fields.push({
                name: 'Top 6 Commands',
                value: 'Overall',
                inline: false
            });
            for (let i = 0; i < stats.length; i++) {
                embeds.fields.push({
                    name: stats[i].name,
                    value: '' + stats[i].uses,
                    inline: true
                });
            }
        }
        console.debug(embeds.fields);
        console.debug(embeds.fields.length);
        bu.send(msg, {
            embed: embeds
        });
    }
}

module.exports = StatsCommand;
