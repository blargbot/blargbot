import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { isFlagKey } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.flagSet;

export class FlagSetSubtag extends CompiledSubtag {
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
        if (!isFlagKey(flagName))
            return false;

        return context.local.input.flags[flagName] !== undefined;
    }
}
