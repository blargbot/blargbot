import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.dump;

export class DumpSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'dump',
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
    }

    public async createDump(context: BBTagContext, text: string): Promise<string> {
        const id = await context.util.generateDumpPage({ content: text }, context.channel);
        return context.util.websiteLink(`dumps/${id}`);
    }
}
