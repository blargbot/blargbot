const BaseCommand = require('../structures/BaseCommand');

var events = [
    'memberban',
    'memberunban',
    'memberjoin',
    'memberleave',
    'messagedelete',
    'messageupdate',
    'nameupdate',
    'avatarupdate',
    'nickupdate'
];

class LogCommand extends BaseCommand {
    constructor() {
        super({
            name: 'log',
            category: bu.CommandType.ADMIN,
            usage: 'log <list | enable <channel> <event name>... | disable <event name>...>',
            info: 'Toggles logging for the specified events. Available events are:\n- memberban - when a user gets banned\n- memberunban - when a user gets unbanned\n- memberjoin - when a user joins\n- memberleave - when a user leaves\n- messagedelete - when a message gets deleted\n- messageupdate - when a message gets updated\n- nameupdate - when a user changes their username\n- avatarupdate - when a user changes their avatar\n- nickupdate - when a user changes their nickname\n- all - enables all of the events'
        });
    }

    async execute(msg, words, text) {
        let storedGuild = await bu.getGuild(msg.guild.id);;
        if (!storedGuild.hasOwnProperty('log')) storedGuild.log = {};
        console.debug(words);
        if (words.length >= 2) {
            switch (words[1].toLowerCase()) {
                case 'list':
                    let output = 'Currently logged events:\n';
                    for (let event in storedGuild.log) {
                        output += `${event} - <#${storedGuild.log[event]}>\n`;
                    }
                    bu.send(msg, output);
                    break;
                case 'enable':
                    if (words.length >= 3) {
                        let channel;
                        if (msg.channelMentions.length > 0) {
                            channel = msg.channelMentions[0];
                        } else channel = msg.channel.id;
                        let args = words.slice(2);
                        if (args.map(m => m.toLowerCase()).includes('all')) {
                            for (let event of events) {
                                if (events.indexOf(event.toLowerCase()) > -1)
                                    storedGuild.log[event.toLowerCase()] = channel;
                            }
                        } else
                            for (let event of args) {
                                if (events.indexOf(event.toLowerCase()) > -1)
                                    storedGuild.log[event.toLowerCase()] = channel;
                            }
                        await r.table('guild').get(msg.channel.guild.id).replace(storedGuild);
                        bu.send(msg, 'Done!');
                    } else {
                        bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
                    }
                    break;
                case 'disable':
                    if (words.length >= 2) {
                        let args = words.slice(2);
                        console.debug(storedGuild.log);
                        if (args.map(m => m.toLowerCase()).includes('all'))
                            for (let event of args) {
                                storedGuild.log = {};
                            }
                        else
                            for (let event of args) {
                                storedGuild.log[event.toLowerCase()] = undefined;
                            }
                        console.debug(storedGuild.log);
                        await r.table('guild').get(msg.channel.guild.id).replace(storedGuild);
                        bu.send(msg, 'Done!');
                    } else {
                        bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
                    }
                    break;
                default:
                    bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
                    break;
            }
        } else {
            bu.send(msg, `Usage: \`${this.usage}\`\n${this.info}`);
        }
    }
}

module.exports = LogCommand;
