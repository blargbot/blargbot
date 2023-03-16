import { isAlphanumeric } from '@blargbot/guards';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.flagSet;

@Subtag.id('flagSet')
@Subtag.ctorArgs()
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

    public isFlagSet(context: BBTagScript, flagName: string): boolean {
        if (!isAlphanumeric(flagName) && flagName !== '_')
            return false;

        return context.flaggedInput[flagName] !== undefined;
    }
}
