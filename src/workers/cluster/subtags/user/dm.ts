import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, SubtagType } from '@cluster/utils';

const dmCache: DMCache = {};

export class DMSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'dm',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['user', 'message|embed', 'embed?'],
                    description: 'DMs `user` the given `message` and `embed`. At least one of `message` and `embed` must be provided. If `message|embed` is a valid object, it will be treated as embed. ' +
                        'You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\n' +
                        'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.',
                    exampleCode: '{dm;stupid cat;Hello;{embedbuild;title:You\'re cool}}',
                    exampleOut: 'DM: Hello\nEmbed: You\'re cool',
                    execute: (ctx, [user, content, embed], subtag) => this.sendDm(ctx, subtag, user.value, content.value, embed.value)
                }
            ]
        });
    }

    public async sendDm(
        context: BBTagContext,
        subtag: SubtagCall,
        userStr: string,
        messageStr: string,
        embedStr?: string
    ): Promise<string | void> {
        const user = await context.getUser(userStr, {
            suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        });
        let content: string | undefined = messageStr;
        let embed = discordUtil.parseEmbed(messageStr);

        if (user === undefined)
            return this.noUserFound(context, subtag);
        if (await context.util.getMemberById(context.guild, user.id) === undefined)
            return this.userNotInGuild(context, subtag);

        if (embed !== undefined && embed.malformed !== true)
            content = undefined;
        else
            embed = discordUtil.parseEmbed(embedStr);

        try {
            const dmChannel = user.dmChannel ?? await user.createDM();
            let cache = dmCache[user.id];
            if (cache === undefined ||
                cache.count > 5 ||
                cache.user !== context.user.id ||
                cache.guild !== context.guild.id) {
                // Ew we're gonna send a message first? It was voted...
                await context.util.send(dmChannel, 'The following message was sent from ' +
                    `**__${context.guild.name}__** (${context.guild.id}), ` +
                    'and was sent by ' +
                    `**__${context.user.username}#${context.user.discriminator}}__** (${context.user.id}):`
                );
                cache = dmCache[user.id] = { user: context.user.id, guild: context.guild.id, count: 1 };
            }
            await context.util.send(dmChannel.id, {
                content,
                embeds: embed !== undefined ? [embed] : undefined,
                nsfw: context.state.nsfw
            });
            cache.count++;
        } catch (e: unknown) {
            return this.customError('Could not send DM', context, subtag);
        }
    }
}

interface DMCache {
    [index: string]: {
        guild: string;
        count: number;
        user: string;
    } | undefined;
}
