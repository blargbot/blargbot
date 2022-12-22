import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

import type { SubtagCall } from '../../language/index.js';

export class DebugSubtag extends Subtag {
    public constructor() {
        super({
            name: 'debug',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, text, subtag) => this.addDebug(ctx, text.map(x => x.value).join(' '), subtag)
                }
            ]
        });
    }

    public addDebug(context: BBTagContext, text: string, subtag: SubtagCall): void {
        context.debug.push({ subtag, text });
    }
}
