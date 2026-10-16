import { humanize, parse } from '@blargbot/core';
import type { GuildCommandTag } from '@blargbot/domain';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { toBBTagInput } from '../../toBBTagInput.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.execCustomCommand;

export interface GetCustomCommandThunk {
    (guildId: string, name: string): Awaitable<GuildCommandTag | undefined>;
}

export class ExecCustomCommandSubtag extends CompiledSubtag {
    readonly #getCustomCommand: GetCustomCommandThunk;
    public constructor({ getCustomCommand }: { getCustomCommand: GetCustomCommandThunk; }) {
        super({
            name: 'execCustomCommand',
            aliases: ['execCC'],
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name', 'args*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [name, ...args]) => this.execCustomCommand(ctx, name.value, args.map(a => a.value))
                }
            ]
        });
        this.#getCustomCommand = getCustomCommand;
    }

    async #cacheTag(context: BBTagContext, name: string): Promise<GuildCommandTag | undefined> {
        const result = await this.#getCustomCommand(context.local.message.channel.guild.id, name);
        if (result !== undefined)
            context.root.ccCache.set(name, result);
        return result;
    }

    public async execCustomCommand(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name.toLowerCase();
        const ccommand = context.root.ccCache.get(tagName)
            ?? await this.#cacheTag(context, tagName);

        if (ccommand === undefined)
            throw new BBTagRuntimeError(`CCommand not found: ${tagName}`);
        if ('alias' in ccommand)
            throw new BBTagRuntimeError(`Cannot execcc imported tag: ${tagName}`);

        let input = args[0] ?? '';
        if (args.length > 1)
            input = humanize.smartSplit.inverse(bbtag.tagArray.flattenArray(args).map(x => parse.string(x)));

        using scope = context.enterScope();
        scope.tagName = tagName;
        scope.cooldown = ccommand.cooldown ?? 0;
        scope.input = toBBTagInput(input, context.root.flagDefinitions);
        const expr = bbtag.parse(ccommand.content, { throw: true });
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
