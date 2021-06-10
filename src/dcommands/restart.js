const BaseCommand = require('../structures/BaseCommand');

class RestartCommand extends BaseCommand {
    constructor() {
        super({
            name: 'restart',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (bu.isDeveloper(msg.author.id)) {
            if (words[1] === 'kill') {
                await bu.send(msg, 'Ah! You\'ve killed me! D:');
                await r.table('vars').get('restart').replace({
                    varname: 'restart',
                    varvalue: {
                        channel: msg.channel.id,
                        time: r.now()
                    }
                }).run();
                bot.sender.send('KILLEVERYTHING', msg.channel.id);
            } else if (words[1] === 'frontend') {
                await bot.sender.awaitMessage('respawnFrontend', {});
                await bu.send(msg, 'Frontend has been respawned.');
            } else {
                await bu.send(msg, 'Ah! You\'ve killed me but in a way that minimizes downtime! D:');
                bot.sender.send('respawnAll', msg.channel.id);
            }
        }
    }
}

module.exports = RestartCommand;
