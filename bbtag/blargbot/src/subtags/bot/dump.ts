import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { DumpService } from '../../services/DumpService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.dump;

@Subtag.names('dump')
@Subtag.ctorArgs('dump')
export class DumpSubtag extends CompiledSubtag {
    readonly #dump: DumpService;

    public constructor(dump: DumpService) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [text]) => this.createDump(ctx, text.value)
                }
            ]
        });

        this.#dump = dump;
    }

    public async createDump(context: BBTagContext, text: string): Promise<string> {
        return await this.#dump.generateDumpPage({ content: text }, context.channel);
    }
}
