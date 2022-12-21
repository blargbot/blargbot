import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class DumpSubtag extends Subtag {
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
