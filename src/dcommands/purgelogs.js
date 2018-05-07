const BaseCommand = require('../structures/BaseCommand');

class PurgelogsCommand extends BaseCommand {
    constructor() {
        super({
            name: 'purgelogs',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === bu.CAT_ID) {
            await bu.send(msg, 'Ok, I\'ll purge all chat log records that are over a week old. This is going to take a while, so I\'ll ping you once I\'m done.');
            let start = dep.moment();
            let returnObj = await deleteLogs();
            let end = dep.moment();
            let diff = dep.moment.duration(end - start);
            bu.send(msg, `Ok, ${msg.author.mention}! I'm finished!
${returnObj.deleted} records were deleted.
The operation took:
    ${diff.days()} days
    ${diff.hours()} hours
    ${diff.minutes()} minutes
    ${diff.seconds()} seconds
    ${diff.milliseconds()} milliseconds`);
        }
    }
}

module.exports = PurgelogsCommand;
