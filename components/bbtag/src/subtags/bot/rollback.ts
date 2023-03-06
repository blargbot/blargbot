import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.rollback;

@Subtag.names('rollback')
@Subtag.ctorArgs('arrayTools', 'converter')
export class RollbackSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleOut: tag.all.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.rollback(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: tag.variables.description,
                    exampleCode: tag.variables.exampleCode,
                    exampleOut: tag.variables.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, variables) => this.rollback(ctx, variables.map((arg) => arg.value))
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public rollback(context: BBTagContext, args: string[]): void {
        const keys = args.length === 0
            ? undefined
            : this.#arrayTools.flattenArray(args).map(v => this.#converter.string(v));
        context.variables.reset(keys);
    }
}
