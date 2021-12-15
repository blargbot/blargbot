import { DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class InjectSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: async (context, [code]) => {
                        const result = await context.engine.execute(code.value, context);
                        return result.content;
                    }
                }
            ]
        });
    }
}
