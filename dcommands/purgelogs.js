var e = module.exports = {};
const moment = require('moment');
e.init = () => {
    e.category = bu.CommandType.CAT;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = async function(msg) {
    if (msg.author.id === bu.CAT_ID) {
        await bu.send(msg, 'Ok, I\'ll purge all chat log records that are over a week old. This is going to take a while, so I\'ll ping you once I\'m done.');
        let start = moment();
        let returnObj = await r.table('chatlogs')
            .between(r.epochTime(0), r.now().sub(7 * 24 * 60 * 60), {
                index: 'msgtime'
            }).delete().run();
        let end = moment();
        let diff = moment.duration(end - start);
        bu.send(msg, `Ok, ${msg.author.mention}! I'm finished!
${returnObj.deleted} records were deleted.
The operation took:
    ${diff.days()} days
    ${diff.hours()} hours
    ${diff.minutes()} minutes
    ${diff.seconds()} seconds
    ${diff.milliseconds()} milliseconds`);
    }
};

const logLogChannel = '254034744134598676';

e.event = async function(args) {
    let tomorrow = moment(moment().format('YYYY-MM-DD')).add(1, 'd');
    await r.table('events').insert({
        type: 'purgelogs',
        endtime: r.epochTime(tomorrow.unix())
    });

    await bu.send(logLogChannel, 'Doing a daily purge of logs that are over a week old.');
    let start = moment();
    let returnObj = await r.table('chatlogs')
        .between(r.epochTime(0), r.now().sub(7 * 24 * 60 * 60), {
            index: 'msgtime'
        }).delete().run();
    let end = moment();
    let diff = moment.duration(end - start);
    bu.send(logLogChannel, `I'm finished!
${returnObj.deleted} records were deleted.
The operation took:
    ${diff.days()} days
    ${diff.hours()} hours
    ${diff.minutes()} minutes
    ${diff.seconds()} seconds
    ${diff.milliseconds()} milliseconds

The next operation will be ${moment.duration(tomorrow - moment()).humanize(true)}`);
};