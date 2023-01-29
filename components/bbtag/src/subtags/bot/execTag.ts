import { humanize } from '@blargbot/core/utils/index.js';
import type { TagStore } from '@blargbot/domain/stores/TagStore.js';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { parseBBTag } from '../../language/parseBBTag.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.execTag;

@Subtag.names('execTag', 'exec')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.converter(), Subtag.store('tags'))
export class ExecTagSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;
    readonly #tags: TagStore;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter, tags: TagStore) {
        super({
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

        this.#arrayTools = arrayTools;
        this.#converter = converter;
        this.#tags = tags;
    }

    public async execTag(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name;
        const tag = await context.getTag('tag', tagName, (key) => this.#tags.get(key));

        if (tag === null)
            throw new BBTagRuntimeError(`Tag not found: ${tagName}`);

        let input = args[0] ?? '';
        if (args.length > 1)
            input = humanize.smartSplit.inverse(this.#arrayTools.flattenArray(args).map(x => this.#converter.string(x)));

        return await context.withScope(true, () => context.withStack(() => context.withChild({
            tagName,
            cooldown: tag.cooldown ?? 0,
            inputRaw: input
        }, async context => {
            const ast = parseBBTag(tag.content);
            const result = await context.eval(ast);
            if (context.data.state === BBTagRuntimeState.RETURN)
                context.data.state = BBTagRuntimeState.RUNNING;
            return result;
        })));
    }
}
