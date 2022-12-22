import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class InjectSubtag extends Subtag {
    public constructor() {
        super({
            name: 'inject',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: async (context, [code]) => {
                        return await context.withStack(async () => {
                            const ast = bbtag.parse(code.value, true);
                            const result = await context.engine.eval(ast, context);
                            if (context.data.state === BBTagRuntimeState.RETURN)
                                context.data.state = BBTagRuntimeState.RUNNING;
                            return result;
                        });
                    }
                }
            ]
        });
    }
}
