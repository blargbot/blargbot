import { joinInput } from '@blargbot/input';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.execTag;

@Subtag.id('execTag', 'exec')
@Subtag.ctorArgs('arrayTools', 'converter')
export class ExecTagSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
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
    }

    public async execTag(context: BBTagScript, name: string, args: string[]): Promise<string> {
        const tagName = name;
        const tag = await context.runtime.getTag('tag', tagName);

        if (tag === null)
            throw new BBTagRuntimeError(`Tag not found: ${tagName}`);

        let input = args[0] ?? '';
        if (args.length > 1)
            input = joinInput(this.#arrayTools.flattenArray(args).map(x => this.#converter.string(x)));

        return await context.runtime.withScope(true, () => context.runtime.createScript({
            source: tag.content,
            flags: [],
            inputRaw: input,
            name: tagName,
            cooldownMs: tag.cooldown
        }).execute());
    }
}
