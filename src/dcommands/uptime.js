const BaseCommand = require('../structures/BaseCommand');

class UptimeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'uptime',
            category: bu.CommandType.GENERAL,
            usage: 'uptime',
            info: 'Tells you how long I have been online.'
        });
    }

    async execute(msg, words, text) {
        bu.send(msg, `Bot Uptime: ${bu.createTimeDiffString(dep.moment(), bu.startTime)}`);
    }
}

module.exports = UptimeCommand;
