import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class InjectSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'inject',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['code'],
                    description: 'Executes any arbitrary BBTag that is within `code` and returns the result. Useful for making dynamic code, or as a testing tool (`{inject;{args}}`)',
                    exampleCode: 'Random Number: {inject;{lb}randint{semi}1{semi}4{rb}}',
                    exampleOut: 'Random Number: 3',
                    execute: async (context, [{ value: code }]) => {
                        const result = await context.engine.execute(code, context);
                        return result.content;
                    }
                }
            ]
        });
    }
}
