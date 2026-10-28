import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { TagDetails } from '../../types.js';
import { BBTagRuntimeState } from '../../types.js';
import { convertToString } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import { joinInput, parseInput } from '../../utils/input.js';

const tag = templates.subtags.execCustomCommand;

export interface GetCustomCommandFeature {
    getCustomCommand(guildId: string, name: string): Awaitable<TagDetails | 'alias' | undefined>;
}

type Features = GetCustomCommandFeature;
export class ExecCustomCommandSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    async #cacheTag(context: BBTagContext, name: string): Promise<TagDetails | 'alias' | undefined> {
        const result = await this.#features.getCustomCommand(context.root.guildId, name);
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
        if (ccommand === 'alias')
            throw new BBTagRuntimeError(`Cannot execcc imported tag: ${tagName}`);

        let input = args[0] ?? '';
        if (args.length > 1)
            input = joinInput(bbtag.tagArray.flattenArray(args).map(convertToString));

        using scope = context.enterScope();
        scope.tagName = tagName;
        scope.cooldown = ccommand.cooldown ?? 0;
        scope.input = parseInput(input, context.root.flagDefinitions);
        const expr = bbtag.parse(ccommand.content, { throw: true });
        context.engine.cooldowns.assert({
            guildId: context.root.guildId,
            userId: context.root.userId,
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
