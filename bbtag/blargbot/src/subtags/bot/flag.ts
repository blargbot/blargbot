import { isAlphanumeric } from '@blargbot/guards';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.flag;

@Subtag.id('flag')
@Subtag.ctorArgs()
export class FlagSubtag extends CompiledSubtag {
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
                    returns: 'string|nothing',
                    execute: (ctx, [flagName]) => this.getFlag(ctx, flagName.value)
                }
            ]
        });
    }

    public getFlag(context: BBTagScript, flagName: string): string | undefined {
        if (!isAlphanumeric(flagName) && flagName !== '_')
            return undefined;

        return context.flaggedInput[flagName]?.merge().value;
    }
}
