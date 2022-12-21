import { guard } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class FlagSubtag extends Subtag {
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
