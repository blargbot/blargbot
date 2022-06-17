import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class DMSubtag extends CompiledSubtag {
    readonly #dmCache: DMCache = {};

    public constructor() {
        super({
            name: 'dm',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user', 'message|embed'],
                    description: 'DMs `user` the given `message|embed`. If `message|embed` is a valid embed, it will be treated as embed. ' +
                        'You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\n' +
                        'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.',
                    exampleCode: '{dm;stupid cat;Hello;{embedbuild;title:You\'re cool}}',
                    exampleOut: 'DM: Hello\nEmbed: You\'re cool',
                    returns: 'nothing',
                    execute: (ctx, [user, content]) => this.sendDm(ctx, user.value, content.value, undefined)
                },
                {
                    parameters: ['user', 'message', 'embed'],
                    description: 'DMs `user` the given `message` and `embed`. ' +
                        'You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\n' +
                        'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.',
                    exampleCode: '{dm;stupid cat;Hello;{embedbuild;title:You\'re cool}}',
                    exampleOut: 'DM: Hello\nEmbed: You\'re cool',
                    returns: 'nothing',
                    execute: (ctx, [user, message, embed]) => this.sendDm(ctx, user.value, message.value, embed.value)
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

        const messageAsEmbeds = embedStr === undefined ? parse.embed(messageStr, false) : undefined;
        const embeds = messageAsEmbeds ?? parse.embed(embedStr);
        const content = messageAsEmbeds === undefined ? messageStr : undefined;

        try {
            let cache = this.#dmCache[member.id];
            if (cache === undefined ||
                cache.count > 5 ||
                cache.user !== context.user.id ||
                cache.guild !== context.guild.id) {
                // Ew we're gonna send a message first? It was voted...
                // TODO: Maybe change to a footer embed on every DM? I dont think its possible to disable embeds in DMs
                await context.util.sendDM(member, 'The following message was sent from ' +
                    `**__${context.guild.name}__** (${context.guild.id}), ` +
                    'and was sent by ' +
                    `**__${context.user.username}#${context.user.discriminator}__** (${context.user.id}):`
                );
                cache = this.#dmCache[member.id] = { user: context.user.id, guild: context.guild.id, count: 1 };
            }
            await context.util.sendDM(member, {
                content,
                embeds,
                nsfw: context.data.nsfw
            });
            cache.count++;
        } catch (e: unknown) {
            context.logger.error('DM failed', e);
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
