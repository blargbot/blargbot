const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');
const newbutils = require('../newbu');

class TimersCommand extends BaseCommand {
    constructor() {
        super({
            name: 'timers',
            category: newbutils.commandTypes.ADMIN,
            usage: 'timers <[page] | cancel <ids...> | clear | raw <id>>',
            info: 'Lists all the timers currently active here. You can also cancel any of them by using the cancel subcommand'
        });
        this.pageSize = 15;
    }

    async execute(msg, words) {
        let source = msg.guild ? msg.guild.id : msg.author.id;
        switch (String(words[1] || '').toLowerCase()) {
            case 'clear': {
                let response = await bu.awaitPrompt(msg, 'Are you sure you want to cancel all timers? Type `yes` to confirm, or anything else to cancel.',
                    () => true, 60000, 'Query timed out. Cancelling clear');
                if (response && response.content.toLowerCase() == 'yes') {
                    await bu.events.deleteFilter({ source });
                    bu.send(msg, 'All timers cancelled.');
                } else {
                    bu.send(msg, 'Failed to clear timers');
                }
                break;
            }
            case 'delete':
            case 'cancel':
                if (words[2]) {
                    let ids = (words.slice(2) || '').map(s => s.toLowerCase());
                    let timers = await r.table('events').filter({ source }).run();
                    let failed = [];
                    let success = [];
                    for (const id of ids) {
                        let timer = timers.find(t => t.id.startsWith(id));
                        if (timer && timer.source == source) {
                            bu.events.delete(timer.id);
                            success.push(id);
                        } else {
                            failed.push(id);
                        }
                    }
                    if (success.length == 0)
                        bu.send(msg, `I couldnt find ${ids.length != 1 ? 'any of the ids you gave' : 'the id you gave'}`);
                    else
                        bu.send(msg, `Successfully cancelled ${success.length} timer${success.length != 1 ? 's' : ''} \`${success.join(', ')}\`.` +
                            (failed.length == 0 ? '' : ` Could not find id${failed.length != 1 ? 's' : ''} \`${failed.join(', ')}\``));
                } else {
                    bu.send(msg, 'You must give me the id of the timer to cancel.');
                }
                break;
            case 'content':
            case 'info':
            case 'raw':
                if (words[2]) {
                    let id = (words.slice(2) || '').map(s => s.toLowerCase())[0];
                    let timers = await r.table('events').filter({ source }).run();
                    let timer = timers.find(t => t.id.startsWith(id));
                    if (timer && timer.source == source) {
                        if (timer.content) {
                            bu.send(msg, 'Here is the content of the timer you selected :\n```prolog\n' + timer.content + '\n```');
                        } else {
                            bu.send(msg, 'I couldn\'t display the content of that timer.');
                        }
                    } else {
                        bu.send(msg, 'I couldn\'t find the id you gave.');
                    }
                } else {
                    bu.send(msg, 'You must give me the id of the timer to cancel.');
                }
                break;
            default: {
                let timers = await r.table('events').filter({ source }).run();
                if (timers && timers.length > 0) {
                    let now = moment();
                    timers = timers.map(t => {
                        t.starttime = moment.duration(now.diff(t.starttime));
                        return t;
                    }).sort((a, b) => b.starttime.asMilliseconds() - a.starttime.asMilliseconds());

                    let message = 'Here are your currently active timers:\n```prolog\n';
                    let page = Math.max(parseInt(words[1] || 1) - 1, 0);
                    if (isNaN(page))
                        return await bu.send(msg, words[1] + ' is not a valid page number!');

                    let from;
                    let to;
                    let selected = timers.slice(from = page * this.pageSize, to = Math.min((page + 1) * this.pageSize, timers.length));
                    if (selected.length == 0)
                        selected = timers.slice(from = (to = timers.length) - (timers.length % this.pageSize));

                    let getUserString = user => typeof user === 'object' ? `${user.username}#${user.discriminator}` : user;
                    let records = [];
                    for (const timer of selected) {
                        let id = timer.id.substring(0, 5);
                        let type = timer.type;
                        let user = getUserString(bot.users.get(timer.user) || timer.user);
                        let elapsed = timer.starttime.humanize();
                        let remain = moment.duration(now.diff(timer.endtime)).humanize();
                        let content = Array.from(timer.content || '');
                        if (content.length > 40)
                            content = content.slice(0, 37).concat(['...']);
                        content = content.join('').replace(/[\n\t\r]/g, '');
                        records.push([id, elapsed, remain, Array.from(user), type, content]);
                    }
                    let headers = ['Id', 'Elapsed', 'Remain', 'User', 'Type', 'Content'];
                    let colSizes = records.concat([headers]).reduce((p, c) => {
                        c.forEach((v, i) => p[i] = Math.max(p[i], v.length));
                        return p;
                    }, records[0].map(() => 0));
                    console.debug(colSizes);
                    let mapLine = l =>
                        l.map((v, i) => {
                            if (typeof v === 'string')
                                return v.padEnd(colSizes[i]);
                            for (let j = v.length; j < colSizes[i]; j++)
                                v.push(' ');
                            return v.join('');
                        }).join(' | ');
                    message += mapLine(headers) + '\n';
                    message += ''.padEnd(colSizes.reduce((p, c) => p + c, 0) + (colSizes.length - 1) * 3, '-') + '\n';
                    message += records.map(mapLine).join('\n');

                    message += '```';

                    if (timers.length > selected.length)
                        message += `Showing timers ${from} - ${to} of ${timers.length}. Page ${page + 1} of ${Math.ceil(timers.length / this.pageSize)}`;

                    bu.send(msg, message);
                } else {
                    bu.send(msg, 'There are no currently active timers!');
                }
                break;
            }
        }
    }
}

module.exports = TimersCommand;
