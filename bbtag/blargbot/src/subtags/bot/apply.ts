import type { BBTagCall } from '../../BBTagCall.js';
import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.apply;

@Subtag.id('apply')
@Subtag.ctorArgs('arrayTools', 'converter')
export class ApplySubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['subtag', 'args*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [subtagName, ...args], subtag) => this.defaultApply(ctx, subtagName.value, args.map(a => a.value), subtag)
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async defaultApply(
        context: BBTagScript,
        subtagName: string,
        args: string[],
        subtag: BBTagCall
    ): Promise<string> {
        if (context.runtime.subtags.get(subtagName.toLowerCase()) === undefined)
            throw new BBTagRuntimeError('No subtag found');

        const flatArgs = args
            .flatMap(arg => this.#arrayTools.deserialize(arg)?.v ?? [arg])
            .map(v => this.#converter.string(v));

        const source = `{${[subtagName, ...flatArgs].join(';')}}`;

        return await context.eval({
            values: [{
                name: {
                    start: subtag.ast.start,
                    end: subtag.ast.start,
                    values: [subtagName],
                    source: subtagName
                },
                args: flatArgs.map(arg => ({
                    start: subtag.ast.start,
                    end: subtag.ast.start,
                    values: [arg],
                    source: arg
                })),
                start: subtag.ast.start,
                end: subtag.ast.end,
                source
            }],
            start: subtag.ast.start,
            end: subtag.ast.end,
            source
        });
    }
}
