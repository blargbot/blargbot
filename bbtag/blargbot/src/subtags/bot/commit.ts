import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.commit;

@Subtag.names('commit')
@Subtag.ctorArgs('arrayTools', 'converter')
export class CommitSubtag extends CompiledSubtag {
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
                    execute: (ctx) => this.commit(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: tag.variables.description,
                    exampleCode: tag.variables.exampleCode,
                    exampleOut: tag.variables.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, variables) => this.commit(ctx, variables.map((arg) => arg.value))
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async commit(
        context: BBTagContext,
        args: string[]
    ): Promise<void> {
        const values = args.length === 0
            ? undefined
            : this.#arrayTools.flattenArray(args).map(value => this.#converter.string(value));
        await context.variables.persist(values);
    }
}
