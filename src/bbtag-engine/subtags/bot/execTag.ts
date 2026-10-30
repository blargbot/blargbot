import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { TagDetails } from '../../types.js';
import { BBTagRuntimeState } from '../../types.js';
import { convertToString } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { ParseInputFeature, TagCooldownFeature } from '../types.js';

const tag = templates.subtags.execTag;

export interface GetTagFeature {
    getTag(name: string): Awaitable<TagDetails | undefined>;
}

type Features = GetTagFeature & TagCooldownFeature & ParseInputFeature
export class ExecTagSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    async #cacheTag(context: BBTagContext, name: string): Promise<TagDetails | undefined> {
        const result = await this.#features.getTag(name);
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

        using scope = context.enterScope();
        scope.tagName = tagName;
        scope.input = this.#features.parseInput(
            context,
            args.length > 1
                ? bbtag.tagArray.flattenArray(args).map(convertToString)
                : args[0] ?? ''
        );
        const expr = bbtag.parse(tag.content, { throw: true });
        await this.#features.assertTagCooldown({
            guildId: context.root.guildId,
            userId: context.root.userId,
            tagName: context.local.tagName,
            isCC: context.root.isCC,
            cooldownMs: tag.cooldown ?? 0
        });
        using _recurse = context.enterRecursion();
        const result = await context.eval(expr);
        if (context.state === BBTagRuntimeState.RETURN)
            context.state = BBTagRuntimeState.RUNNING;
        return result;
    }
}
