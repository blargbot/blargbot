import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';
import { discord } from '../utils';

interface DMCache {
    [index: string]: {
        guild: string;
        count: number;
        user: string;
    }
}
const DMCache: DMCache = {};
export class DMSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
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
                    execute: (ctx, args, subtag) => this.sendDm(ctx, subtag, args[0].value, args[1].value, args[2]?.value)
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
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });
        let content: string | undefined = messageStr,
            embed = discord.parseEmbed(messageStr);

        if (user == null)
            return this.noUserFound(context, subtag);
        if (!context.guild.members.get(user.id))
            return this.userNotInGuild(context, subtag);

        if (embed != null && !embed.malformed)
            content = undefined;
        else
            embed = discord.parseEmbed(embedStr);

        try {
            const DMChannel = await user.getDMChannel();
            if (!DMCache[user.id] ||
                DMCache[user.id].count > 5 ||
                DMCache[user.id].user != context.user.id ||
                DMCache[user.id].guild != context.guild.id) {
                // Ew we're gonna send a message first? It was voted...
                await this.cluster.util.send(DMChannel.id, 'The following message was sent from ' +
                    `**__${context.guild.name}__** (${context.guild.id}), ` +
                    'and was sent by ' +
                    `**__${context.user.username}#${context.user.discriminator}}__** (${context.user.id}):`
                );
                DMCache[user.id] = { user: context.user.id, guild: context.guild.id, count: 1 };
            }
            await this.cluster.util.send(DMChannel.id, {
                content,
                embed,
                nsfw: context.state.nsfw
            });
            DMCache[user.id].count++;
        } catch (e) {
            return this.customError('Could not send DM', context, subtag);
        }
    }
}