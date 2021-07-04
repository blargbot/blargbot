const BaseCommand = require('../structures/BaseCommand');
const moment = require('moment-timezone');
const Airtable = require('airtable');
const newbutils = require('../newbu');

let types = {
    Command: 'Relating to blargbot\'s base commands',
    BBTag: 'Relating to BBTag and its components (subtags, tags, and custom commands)',
    Documentation: 'Relating to blargbot\'s documentation, both in commands and on the website',
    'Other Functionality': 'Anything that doesn\'t fit the other categories'
};

class FeedbackCommand extends BaseCommand {
    constructor(cluster) {
        super({
            name: 'feedback',
            aliases: ['suggest', 'report'],
            category: newbutils.commandTypes.GENERAL,
            usage: 'feedback <feedback>',
            info: 'This command has three different functions for varying purposes. Please do not abuse it.\n\n**__feedback__** - give me feedback about the bot\n**__suggest__** - tell me something you want to be added or changed\n**__report__** - let me know about a bug you found\n\nThank you for your support. It means a lot to me!',
            flags: [
                { flag: 'd', word: 'desc', desc: 'The description for your suggestion' },
                { flag: 'c', word: 'command', desc: 'Signify your suggestion is for a command' },
                { flag: 'b', word: 'bbtag', desc: 'Signify your suggestion is for BBTag' },
                { flag: 'a', word: 'docs', desc: 'Signify your suggestion is for documentation' },
                { flag: 'o', word: 'other', desc: 'Signify your suggestion is for other functionality' },
                { flag: 'e', word: 'edit', desc: 'Edits an existing suggestion with the provided case number' }
            ]
        });

        this.airtable = new Airtable({
            endpointUrl: 'https://api.airtable.com',
            apiKey: cluster.config.airtable.key
        }).base(cluster.config.airtable.base);
    }

    async find(table, id) {
        let data = await this.airtable(table).select({
            maxRecords: 1,
            filterByFormula: `{ID} = '${id}'`
        }).firstPage();
        if (Array.isArray(data)) return data[0];
        return null;
    }

    async execute(msg, words) {
        let input = newbutils.parse.flags(this.flags, words);
        if (words.length > 1) {
            let blacklist = await r.table('vars').get('blacklist');
            if (blacklist.users.indexOf(msg.author.id) > -1) {
                bu.send(msg, 'Sorry, you have been blacklisted from the use of the `feedback`, `suggest`, and `report` commands. If you wish to appeal this, please join my support guild. You can find a link by doing `b!invite`.');
                return;
            } else if (msg.guild && blacklist.guilds.indexOf(msg.guild.id) > -1) {
                bu.send(msg, 'Sorry, your guild has been blacklisted from the use of the `feedback`, `suggest`, and `report` commands. If you wish to appeal this, please join my support guild. You can find a link by doing `b!invite`.');
                return;
            }
            if (words.length > 3 && msg.author.id == config.discord.users.owner) {
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
                    case 'unblacklist': {
                        let index;
                        switch (words[2].toLowerCase()) {
                            case 'guild':
                                while ((index = blacklist.guilds.indexOf(words[3])) > -1) {
                                    blacklist.guilds.splice(index, 1);
                                }
                                break;
                            case 'user':
                                while ((index = blacklist.users.indexOf(words[3])) > -1) {
                                    blacklist.users.splice(index, 1);
                                }
                                break;
                        }
                        await r.table('vars').get('blacklist').replace(blacklist);
                        await bu.send(msg, 'Done');
                        return;
                    }
                }
            }
            let type;
            let colour;
            let channel;
            let bug = false;
            let subTypes = [];

            let title = input.undefined.join(' ').replace(/ +/g, ' ');
            if (title.length > 64 || /\n/.test(title))
                return await bu.send(msg, 'Sorry, your title cannot include newlines and must be under 64 characters. To include more information, use the description (-d, --desc) flag.');

            switch (words[0].toLowerCase()) {
                case 'suggest':
                    type = 'Suggestion';
                    colour = 0x1faf0c;
                    channel = config.discord.channels.suggestions;
                    break;
                case 'report':
                    type = 'Bug Report';
                    colour = 0xaf0c0c;
                    channel = config.discord.channels.bugreports;
                    bug = true;
                    break;
                default:
                    type = 'Feedback';
                    colour = 0xaaaf0c;
                    channel = config.discord.channels.feedback;
                    subTypes.push('Feedback');
                    break;
            }
            if (input.c) subTypes.push('Command');
            if (input.b) subTypes.push('BBTag');
            if (input.a) subTypes.push('Documentation');
            if (input.o) subTypes.push('Other Functionality');
            if (subTypes.length === 0) {
                let t = [];
                let keys = Object.keys(types);
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    t.push((i + 1) + '. ' + key + ' - ' + types[key]);
                }
                let m = await bu.awaitQuery(msg, 'Please type the numbers of the types that apply to your suggestion, separated by spaces:\n' + t.join('\n'));
                let c = m.content.split(/\s+/);
                for (const _i of c) {
                    let i = parseInt(_i);
                    if (!isNaN(i) && keys[i - 1])
                        subTypes.push(keys[i - 1]);
                }
                if (subTypes.length === 0)
                    return await bu.send(msg, 'Sorry, you didn\'t provide any valid suggestion types. Try again later.');
            }

            try {
                if (input.e) {
                    let caseNum = parseInt(input.e[0]);
                    if (isNaN(caseNum)) return bu.send(msg, 'You must provide a valid case number.');
                    let data = await this.find('Suggestions', caseNum);
                    if (data) {
                        console.log(data);
                        let author = await this.airtable('Suggestors').find(data.fields.Author[0]);
                        console.log(author);
                        if (author.fields.ID === msg.author.id) {
                            let payload = {
                                Bug: bug, Type: subTypes, Title: title,
                                Description: input.d ? input.d.join(' ') : undefined,
                                Message: msg.id, Channel: msg.channel.id, Edits: data.fields.Edited + 1,
                                'Last Edited': moment().valueOf()
                            };
                            await this.airtable('Suggestions').update(data.id, payload);
                            await bu.send(msg, 'Your case has been updated.');
                        } else return bu.send(msg, 'You are not the author of this case.');
                    } else return bu.send(msg, 'There was no case with the provided ID.');
                } else {
                    let username = msg.author.username + '#' + msg.author.discriminator;
                    let u = await this.find('Suggestors', msg.author.id);
                    if (!u) {
                        u = await this.airtable('Suggestors').create({
                            ID: msg.author.id,
                            Username: username
                        }, { typecast: true });
                    } else if (u.fields.Username !== username)
                        await this.airtable('Suggestors').update(u.id, {
                            Username: username
                        });

                    let payload = {
                        AA: true,
                        Bug: bug, Type: subTypes, Title: title,
                        Description: input.d ? input.d.join(' ') : undefined,
                        Message: msg.id, Channel: msg.channel.id, Author: [u.id]
                    };
                    let data = await this.airtable('Suggestions').create(payload);

                    let url = 'https://blargbot.xyz/feedback/' + data.id;

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
                }
            } catch (err) {
                console.error(err);
                await bu.send(msg, 'An error occured posting to airtable. Please try again.');
            }
        }
    }
}

module.exports = FeedbackCommand;
