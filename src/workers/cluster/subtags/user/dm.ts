import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, UserNotFoundError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';

const dmCache: DMCache = {};

export class DMSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'dm',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user', 'message|embed', 'embed?'],
                    description: 'DMs `user` the given `message` and `embed`. At least one of `message` and `embed` must be provided. If `message|embed` is a valid object, it will be treated as embed. ' +
                        'You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\n' +
                        'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.',
                    exampleCode: '{dm;stupid cat;Hello;{embedbuild;title:You\'re cool}}',
                    exampleOut: 'DM: Hello\nEmbed: You\'re cool',
                    returns: 'nothing',
                    execute: (ctx, [user, content, embed]) => this.sendDm(ctx, user.value, content.value, embed.value)
                }
            ]
        });
    }

    public async sendDm(
        context: BBTagContext,
        userStr: string,
        messageStr: string,
        embedStr?: string
    ): Promise<void> {
        const member = await context.queryMember(userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const messageAsEmbed = discordUtil.parseEmbed(messageStr, false);
        const embed = messageAsEmbed ?? discordUtil.parseEmbed(embedStr);
        const content = messageAsEmbed === undefined ? messageStr : undefined;

        try {
            const dmChannel = member.user.dmChannel ?? await member.createDM();
            let cache = dmCache[member.id];
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
                cache = dmCache[member.id] = { user: context.user.id, guild: context.guild.id, count: 1 };
            }
            await context.util.send(dmChannel.id, {
                content,
                embeds: embed !== undefined ? [embed] : undefined,
                nsfw: context.state.nsfw
            });
            cache.count++;
        } catch (e: unknown) {
            throw new BBTagRuntimeError('Could not send DM');
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
