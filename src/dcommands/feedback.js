const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');
const Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: config.airtable.key
});
const at = Airtable.base(config.airtable.base);

let types = [
    "Command",
    "BBTag",
    "Other Functionality"
];

class FeedbackCommand extends BaseCommand {
    constructor() {
        super({
            name: 'feedback',
            aliases: ['suggest', 'report'],
            category: bu.CommandType.GENERAL,
            usage: 'feedback <feedback>',
            info: 'This command has three different functions for varying purposes. Please do not abuse it.\n\n**__feedback__** - give me feedback about the bot\n**__suggest__** - tell me something you want to be added or changed\n**__report__** - let me know about a bug you found\n\nThank you for your support. It means a lot to me!',
            flags: [
                { flag: 'd', word: 'desc', desc: 'The description for your suggestion' },
                { flag: 'c', word: 'command', desc: 'Signify your suggestion is for a command' },
                { flag: 'b', word: 'bbtag', desc: 'Signify your suggestion is for BBTag' },
                { flag: 'o', word: 'other', desc: 'Signify your suggestion is for other functionality' }
            ]
        });
    }

    async execute(msg, words, text) {
        let input = bu.parseInput(this.flags, words);
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
            let type, colour, channel, bug = false;
            let subTypes = [];
            switch (words[0].toLowerCase()) {
                case 'suggest':
                    type = 'Suggestion';
                    colour = 0x1faf0c;
                    channel = '195716879237644292';
                    break;
                case 'report':
                    type = 'Bug Report';
                    colour = 0xaf0c0c;
                    channel = '229137183234064384';
                    bug = true;
                    break;
                default:
                    type = 'Feedback';
                    colour = 0xaaaf0c;
                    channel = '268859677326966784';
                    subTypes.push('Feedback');
                    break;
            }
            if (input.c) subTypes.push('Command');
            if (input.b) subTypes.push('BBTag');
            if (input.o) subTypes.push('Other Functionality');
            if (subTypes.length === 0) {
                let t = [];
                for (let i = 0; i < types.length; i++)
                    t.push((i + 1) + '. ' + types[i]);
                let m = await bu.awaitQuery(msg, 'Please type the numbers of the types that apply to your suggestion, separated by spaces:\n' + t.join('\n'));
                let c = m.content.split(/\s+/);
                for (const _i of c) {
                    let i = parseInt(_i);
                    if (!isNaN(i) && types[i - 1])
                        subTypes.push(types[i - 1]);
                }
                if (subTypes.length === 0)
                    return await bu.send(msg, 'Sorry, you didn\'t provide any valid suggestion types. Try again later.');
            }

            try {
                let username = msg.author.username + '#' + msg.author.discriminator;
                let u = await at('Suggestors').select({
                    maxRecords: 1,
                    filterByFormula: '{ID} = \'' + msg.author.id + '\''
                }).firstPage();
                if (u.length === 0) {
                    u = await at('Suggestors').create({
                        ID: msg.author.id,
                        Username: username
                    }, { typecast: true });
                } else {
                    u = u[0];
                    if (u.fields.Username !== username)
                        await at('Suggestors').update(u.id, {
                            Username: username
                        });
                }

                let payload = {
                    AA: true,
                    Bug: bug, Type: subTypes, Title: input.undefined.join(' '),
                    Description: input.d ? input.d.join(' ') : undefined,
                    Message: msg.id, Channel: msg.channel.id, Author: [u.id]
                };
                let data = await at('Suggestions').create(payload);

                let url = 'https://airtable.com/shrEUdEv4NM04Wi7O/tblyFuWE6fEAbaOfo/viwDg5WovcwMA9NIL/' + data.id;

                await bu.send(channel, {
                    embed: {
                        title: type,
                        url,
                        description: '**' + payload.Title + '**\n\n' + (payload.Description || ''),
                        color: colour,
                        author: {
                            name: bu.getFullName(msg.author),
                            icon_url: msg.author.avatarURL,
                            url: `https://blargbot.xyz/user/${msg.author.id}`
                        },
                        timestamp: moment(msg.timestamp),
                        footer: {
                            text: 'Case ' + data.fields.ID + ' | ' + msg.id
                        },
                        fields: [{ name: 'Types', value: subTypes.join('\n') }, {
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

                await bu.send(msg, `${type} has been sent with the ID ${data.fields.ID}! :ok_hand:\n\nYou can view your ${type.toLowerCase()} here: <${url}>`);
            } catch (err) {
                console.error(err);
                await bu.send(msg, 'An error occured posting to airtable. Please try again.');
            }
        }
    }
}

module.exports = FeedbackCommand;
