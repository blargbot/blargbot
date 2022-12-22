import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { parse } from '@blargbot/core/utils/index.js';

import { BBTagRuntimeState } from '../../types.js';

export class ReturnSubtag extends Subtag {
    public constructor() {
        super({
            name: 'return',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['force?:true'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (context, [forcedStr]) => this.setReturn(context, forcedStr.value)
                }
            ]
        });
    }

    public setReturn(context: BBTagContext, forcedStr: string): void {
        const forced = parse.boolean(forcedStr, true);
        context.data.state = forced ? BBTagRuntimeState.ABORT : BBTagRuntimeState.RETURN;
    }
}
