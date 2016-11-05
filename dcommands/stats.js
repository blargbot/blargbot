var e = module.exports = {};

var moment = require('moment-timezone');





e.init = () => {
    
    

    e.category = bu.CommandType.GENERAL;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'stats [full]';
e.info = 'Gives you some information about me';
e.longinfo = `<p>Gives you information about the bot.</p>`;

e.execute = async function(msg, words) {
    let full = words[1] && words[1].toLowerCase() == 'full';
    let sum = await r.table('stats').sum('uses').run();
    let stats = await r.table('stats').orderBy({index: r.desc('uses')}).limit(5).run();
    let topCommands = '';
    for (let i = 0; i < stats.length; i++) {
        topCommands += pad(stats[i].name + ':', 13) + ' ' + stats[i].uses + '\n';
    }
    let topCommandsSession = '';
    var sortable = [];
    for (let name in bu.commandStats)
        sortable.push([name, bu.commandStats[name]]);
    sortable.sort(compareStats);
    for (let i = 0; i < sortable.length && i < 5; i++) {
        topCommandsSession += pad(sortable[i][0] + ':', 13) + ' ' + sortable[i][1] + '\n';
    }
    bu.send(msg, `\`\`\`prolog
!== { General Stats } ==!
${pad('Guilds:', 13)} ${bot.guilds.size}
${pad('Channels:', 13)} ${Object.keys(bot.channelGuildMap).length}
${pad('Users:', 13)} ${bot.users.size}
${pad('RAM:', 13)} ${bu.getMemoryUsage()}MiB
${pad('Uptime:', 13)} ${bu.createTimeDiffString(moment(), bu.startTime)}
${pad('Version:', 13)} ${bu.VERSION}
${pad('Messages:', 13)} ${bu.messageStats}
${pad('Per Minute:', 13)} ${Math.floor(bu.messageStats / moment.duration(moment() - bu.startTime).asMinutes() * 100) / 100}

${full ? `!== { Command Stats } ==!
       -- Total --
${pad('Uses:', 13)} ${sum}
${pad('Most Used:', 13)}
${topCommands}
   -- This Session --
${pad('Uses:', 13)} ${bu.commandUses}
${pad('Per Minute:', 13)} ${Math.floor(bu.commandUses / moment.duration(moment() - bu.startTime).asMinutes() * 100) / 100}
${pad('Cleverbot:', 13)} ${bu.cleverbotStats}
${pad('Most Used:', 13)}
${topCommandsSession}` : ''}
\`\`\`
`);
};


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