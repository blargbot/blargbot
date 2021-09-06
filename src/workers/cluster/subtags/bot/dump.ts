import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class DumpSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'dump',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Dumps the provided text to a blargbot output page. These expire after 7 days.',
                    exampleCode: '{dump;Hello, world!}',
                    exampleOut: 'https://blargbot.xyz/output/1111111111111111',
                    execute: (ctx, [text]) => this.createDump(ctx, text.value)
                }
            ]
        });
    }

    public async createDump(context: BBTagContext, text: string): Promise<string> {
        const id = await context.util.generateOutputPage(text, context.channel);
        return context.util.websiteLink(`output/${id.toString()}`);
    }
}
