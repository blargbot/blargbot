const BaseCommand = require('../structures/BaseCommand');

class RespawnCommand extends BaseCommand {
    constructor() {
        super({
            name: 'respawn',
            category: bu.CommandType.GENERAL,
            hidden: true,
            usage: 'respawn <id> | all',
            info: 'Shard respawning only for staff.'
        });
    }

    async execute(msg, words, text) {
        let police = (await r.table('vars').get('police')).value;
        if (police.includes(msg.author.id)) {
            console.log('aaa');
            let id = parseInt(words[1]);
            if (isNaN(id))
                return await bu.send(msg, 'that wasn\'t even a number pls');

            await bu.send('398946258854871052', `**${bu.getFullName(msg.author)}** has called for a respawn of shard ${id}.`);
            bot.sender.send('respawn', { id, channel: msg.channel.id });
            await bu.send(msg, 'ok shard ' + id + ' is being respawned and stuff now');
        }
    }
}

module.exports = RespawnCommand;
