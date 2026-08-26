import { guard } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.flag;

export class FlagSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'flag',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['flagName'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string|nothing',
                    execute: (ctx, [flagName]) => this.getFlag(ctx, flagName.value)
                }
            ]
        });
    }

    public getFlag(context: BBTagContext, flagName: string): string | undefined {
        if (!guard.isFlagChar(flagName) && flagName !== '_')
            return undefined;

        return context.flaggedInput[flagName]?.merge().value;
    }
}
