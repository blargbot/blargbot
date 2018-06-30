const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');

class FeedbackCommand extends BaseCommand {
    constructor() {
        super({
            name: 'feedback',
            aliases: ['suggest', 'report'],
            category: bu.CommandType.GENERAL,
            usage: 'feedback <feedback>',
            info: 'This command has three different functions for varying purposes. Please do not abuse it.\n\n**__feedback__** - give me feedback about the bot\n**__suggest__** - tell me something you want to be added or changed\n**__report__** - let me know about a bug you found\n\nThank you for your support. It means a lot to me!'
        });
    }

    async execute(msg, words, text) {
        if (words.length > 1) {
            let blacklist = await r.table('vars').get('blacklist');
            if (blacklist.users.indexOf(msg.author.id) > -1) {
                bu.send(msg, 'Sorry, you have been blacklisted from the use of the `feedback`, `suggest`, and `report` commands. If you wish to appeal this, please join my support guild. You can find a link by doing `b!invite`.');
                return;
            } else if (msg.guild && blacklist.guilds.indexOf(msg.guild.id) > -1) {
                bu.send(msg, 'Sorry, your guild has been blacklisted from the use of the `feedback`, `suggest`, and `report` commands. If you wish to appeal this, please join my support guild. You can find a link by doing `b!invite`.');
                return;
            }
            if (words.length > 3 && msg.author.id == bu.CAT_ID) {
                switch (words[1].toLowerCase()) {
                    case 'blacklist':
                        switch (words[2].toLowerCase()) {
                            case 'guild':
                                if (blacklist.guilds.indexOf(words[3]) == -1) blacklist.guilds.push(words[3]);
                                break;
                            case 'user':
                                if (blacklist.users.indexOf(words[3]) == -1) blacklist.users.push(words[3]);
                                break;
                        }
                        await r.table('vars').get('blacklist').replace(blacklist);
                        await bu.send(msg, 'Done');
                        return;
                    case 'unblacklist':
                        let index;
                        switch (words[2].toLowerCase()) {
                            case 'guild':
                                while (index = blacklist.guilds.indexOf(words[3]) > -1) {
                                    blacklist.guilds.splice(index, 1);
                                }
                                break;
                            case 'user':
                                while (index = blacklist.users.indexOf(words[3]) > -1) {
                                    blacklist.users.splice(index, 1);
                                }
                                break;
                        }
                        await r.table('vars').get('blacklist').replace(blacklist);
                        await bu.send(msg, 'Done');
                        return;
                }
            }
            let i = 0;
            let lastSuggestion = await r.table('suggestion').orderBy({
                index: r.desc('id')
            }).limit(1).run();
            if (lastSuggestion.length > 0) i = lastSuggestion[0].id + 1;
            console.debug(i, lastSuggestion);
            if (isNaN(i)) i = 0;
            let type, colour, channel, list;
            switch (words[0].toLowerCase()) {
                case 'suggest':
                    type = 'Suggestion';
                    colour = 0x1faf0c;
                    channel = '195716879237644292';
                    list = '57ef25d2ba874bf651e96fc1';
                    break;
                case 'report':
                    type = 'Bug Report';
                    colour = 0xaf0c0c;
                    channel = '229137183234064384';
                    list = '57ef25d5d777b8b35192eff2';
                    break;
                default:
                    type = 'Feedback';
                    colour = 0xaaaf0c;
                    channel = '268859677326966784';
                    list = '5876a95f090e7f5189cd089b';
                    break;
            }
            if (words[0].toLowerCase() == 'suggest') type = 'Suggestion';
            else if (words[0].toLowerCase() == 'report') type = 'Bug Report';

            function trelloPost() {
                return new Promise((f, r) => {
                    bu.trello.post('1/cards', {
                        name: words.slice(1).join(' '),
                        desc: `Automated ${type} added by ${bot.user.username} - CASE ${i}.\n\nAuthor: ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
                        due: null,
                        idList: list,
                        idLabels: '58025f0184e677fd36dbd756' + (config.general.isbeta ? ',5888db5bced82109fff170af' : '')
                    }, (err, data) => {
                        if (err) {
                            r(err);
                            return;
                        }
                        f(data);
                    });
                });
            }
            try {
                let data = await trelloPost();

                await bu.send(channel, {
                    embed: {
                        title: type,
                        description: words.slice(1).join(' ') + `\n\n[Trello Card](${data.shortUrl})`,
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
                });


                await r.table('suggestion').insert({
                    id: i,
                    author: msg.author.id,
                    channel: msg.channel.id,
                    message: words.slice(1).join(' '),
                    messageid: msg.id,
                    date: r.epochTime(moment().unix()),
                    cardId: data.id,
                    cardUrl: data.shortUrl
                }).run();
                await bu.send(msg, `${type} has been sent, and has been assigned an ID ${i}! :ok_hand:\n\nYou can view your ${type.toLowerCase()} here: <${data.shortUrl}>`);
            } catch (err) {
                console.error(err);
                await bu.send(msg, 'An error occured posting to trello. Please try again.');
            }
        }
    }
}

module.exports = FeedbackCommand;
