import { isAlphanumeric } from '@blargbot/guards';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.flagSet;

@Subtag.id('flagSet')
@Subtag.factory()
export class FlagSetSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
        if (!isAlphanumeric(flagName) && flagName !== '_')
            return false;

        return context.flaggedInput[flagName] !== undefined;
    }
}
