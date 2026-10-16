import { humanize, parse } from '@blargbot/core';
import type { StoredTag } from '@blargbot/domain';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { toBBTagInput } from '../../toBBTagInput.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.execTag;

export interface GetTagThunk {
    (name: string): Awaitable<StoredTag | undefined>;
}

export class ExecTagSubtag extends CompiledSubtag {
    readonly #getTag: GetTagThunk;
    public constructor({ getTag }: { getTag: GetTagThunk; }) {
        super({
            name: 'execTag',
            aliases: ['exec'],
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name', 'args*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [name, ...args]) => this.execTag(ctx, name.value, args.map(a => a.value))
                }
            ]
        });
        this.#getTag = getTag;
    }

    async #cacheTag(context: BBTagContext, name: string): Promise<StoredTag | undefined> {
        const result = await this.#getTag(name);
        if (result !== undefined)
            context.root.tagCache.set(name, result);
        return result;
    }

    public async execTag(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name;
        const tag = context.root.tagCache.get(tagName)
            ?? await this.#cacheTag(context, tagName);

        if (tag === undefined)
            throw new BBTagRuntimeError(`Tag not found: ${tagName}`);

        let input = args[0] ?? '';
        if (args.length > 1)
            input = humanize.smartSplit.inverse(bbtag.tagArray.flattenArray(args).map(x => parse.string(x)));

        using scope = context.enterScope();
        scope.tagName = tagName;
        scope.cooldown = tag.cooldown ?? 0;
        scope.input = toBBTagInput(input, context.root.flagDefinitions);
        const expr = bbtag.parse(tag.content, { throw: true });
        context.engine.cooldowns.assert({
            guildId: context.root.message.channel.guild.id,
            userId: context.root.message.author.id,
            tagName: context.local.tagName,
            isCC: context.root.isCC,
            cooldownMs: context.local.cooldown
        });
        using _recurse = context.enterRecursion();
        const result = await context.eval(expr);
        if (context.state === BBTagRuntimeState.RETURN)
            context.state = BBTagRuntimeState.RUNNING;
        return result;
    }
}
