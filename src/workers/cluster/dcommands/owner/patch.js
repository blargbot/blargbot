const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class PatchCommand extends BaseCommand {
    constructor() {
        super({
            name: 'patch',
            category: newbutils.commandTypes.CAT,
            usage: 'patch [features] [flags]',
            info: 'Makes a patch note',
            flags: [
                { flag: 'f', word: 'fixes', desc: 'The bug fixes of the patch.' },
                { flag: 'n', word: 'notes', desc: 'Other notes.' }
            ]
        });
    }

    async execute(msg, words) {
        if (msg.author.id != config.discord.users.owner) {
            return;
        }
        let input = newbutils.parse.flags(this.flags, words, true);
        let channel = await bot.getChannel(config.discord.channels.changelog);
        let role = channel.guild.roles.get(config.discord.roles.updates);
        let content = role.mention;
        let embed = {
            author: {
                name: `Version ${await bu.getVersion()}`
            },
            fields: [],
            color: newbutils.avatarColours[bu.avatarId]
        };
        if (input.undefined.length > 0) {
            embed.title = 'New Features and Changes';
            embed.description = input.undefined.join(' ');
        }
        if (input.f && input.f.length > 0) {
            embed.fields.push({
                name: 'Bug Fixes',
                value: input.f.join(' ')
            });
        }
        if (input.n && input.n.length > 0) {
            embed.fields.push({
                name: 'Other Notes',
                value: input.n.join(' ')
            });
        }

        let res = await bu.awaitQuery(msg, {
            embed, content: 'This is a preview of what the patch will look like. Say \'yes\' to continue, or anything else to cancel.'
        });
        if (res.content.toLowerCase() !== 'yes')
            return await bu.send(msg, 'Patch canceled.');

        console.info(embed);
        await bu.send(config.discord.channels.changelog, {
            content,
            embed,
            allowedMentions: {
                roles: [role.id]
            }
        });

        let changelogs = await r.table('vars').get('changelog');
        if (changelogs) {
            for (const guild of Object.keys(changelogs.guilds)) {
                const channel = changelogs.guilds[guild];
                try {
                    await bu.send(channel, {
                        embed
                    });
                } catch (err) {
                    delete changelogs.guilds[guild];
                }
            }
            await bu.send(msg, 'Done! Sent to ' + Object.keys(changelogs.guilds).length + ' guilds.');
            console.log(changelogs);
        }
        await r.table('vars').get('changelog').replace(changelogs);
    }
}

module.exports = PatchCommand;
