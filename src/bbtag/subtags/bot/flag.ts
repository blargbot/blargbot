import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class FlagSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `flag`,
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [`flagName`],
                    description: `Returns the value of the specified case-sensitive flag code. Use \`_\` to get the values without a flag.`,
                    exampleCode: `{flag;a} {flag;_}`,
                    exampleIn: `Hello, -a world!`,
                    exampleOut: `world! Hello,`,
                    returns: `string|nothing`,
                    execute: (ctx, [flagName]) => this.getFlag(ctx, flagName.value)
                }
            ]
        });
    }

    public getFlag(context: BBTagContext, flagName: string): string | undefined {
        if (!guard.isFlagChar(flagName) && flagName !== `_`)
            return undefined;

        return context.flaggedInput[flagName]?.merge().value;
    }
}
