import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { guard } from '@blargbot/core/utils/index.js';

export class FlagSetSubtag extends Subtag {
    public constructor() {
        super({
            name: 'flagSet',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['flagName'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [flagName]) => this.isFlagSet(ctx, flagName.value)
                }
            ]
        });
    }

    public isFlagSet(context: BBTagContext, flagName: string): boolean {
        if (!guard.isFlagChar(flagName) && flagName !== '_')
            return false;

        return context.flaggedInput[flagName] !== undefined;
    }
}
