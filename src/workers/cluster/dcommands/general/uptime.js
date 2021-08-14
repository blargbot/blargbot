const moment = require('moment-timezone');
const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class UptimeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'uptime',
            category: newbutils.commandTypes.GENERAL,
            usage: 'uptime',
            info: 'Tells you how long I have been online.'
        });
    }

    async execute(msg) {
        bu.send(msg, `Bot Uptime: ${bu.createTimeDiffString(moment(), bu.startTime)}`);
    }
}

module.exports = UptimeCommand;
