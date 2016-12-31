var e = module.exports = {};

const Trello = require('node-trello');
var t;
const moment = require('moment');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
    t = new Trello(config.general.trellokey, config.general.trellotoken);
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'feedback <feedback>';
e.alias = ['suggest', 'report'];
e.info = `This command has three different functions for varying purposes. Please do not abuse it.

**__feedback__** - give me feedback about the bot
**__suggest__** - tell me something you want to be added or changed
**__report__** - let me know about a bug you found

Thank you for your support. It means a lot to me!`;
e.longinfo = `<p>This command has three different functions for varying purposes. Please do not abuse it.</p>
<ul><li>feedback - give me feedback about the bot</li><li>suggest - tell me something you want added or changed</li><li>report - let me know about a bug you found</li></ul>
<p>Thank you for your support. It means a lot to me!</p>`;

e.execute = async function(msg, words) {
    if (words.length > 1) {
        let i = 0;
        let lastSuggestion = await r.table('suggestion').orderBy({
            index: r.desc('id')
        }).limit(1).run();
        if (lastSuggestion.length > 0) i = lastSuggestion[0].id + 1;
        logger.debug(i, lastSuggestion);
        if (isNaN(i)) i = 0;
        let type, colour;
        switch (words[0].toLowerCase()) {
            case 'suggest':
                type = 'Suggestion';
                colour = 0x1faf0c;
                break;
            case 'report':
                type = 'Bug Report';
                colour = 0xaf0c0c;
                break;
            default:
                type = 'Feedback';
                colour = 0xaaaf0c;
                break;
        }
        if (words[0].toLowerCase() == 'suggest') type = 'Suggestion';
        else if (words[0].toLowerCase() == 'report') type = 'Bug Report';
        await bu.send('195716879237644292', {
            embed: {
                title: type,
                description: words.slice(1).join(' '),
                color: colour,
                author: {
                    name: bu.getFullName(msg.author),
                    icon_url: msg.author.avatarURL,
                    url: `https://blargbot.xyz/user/${msg.author.id}`
                },
                timestamp: moment(msg.timestamp),
                footer: {
                    text: 'Case ' + i + ' | ' + msg.id
                },
                fields: [{
                    name: msg.guild ? msg.guild.name : 'DM',
                    value: msg.guild ? msg.guild.id : 'DM',
                    inline: true
                }, {
                    name: msg.channel.name || 'DM',
                    value: msg.channel.id,
                    inline: true
                }]
            }
        })
        t.post('1/cards', {
            name: words.slice(1).join(' '),
            desc: `Automated feedback added by blargbot - CASE ${i}.\n\nAuthor: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
            due: null,
            idList: '57ef25d2ba874bf651e96fc1',
            idLabels: '58025f0184e677fd36dbd756'
        }, (err) => {
            if (err) throw err;
        });
        await r.table('suggestion').insert({
            id: i,
            author: msg.author.id,
            channel: msg.channel.id,
            message: words.slice(1).join(' '),
            messageid: msg.id,
            date: r.epochTime(moment().unix())
        }).run();
        await bu.send(msg, type + ' sent! :ok_hand:');
    }
};