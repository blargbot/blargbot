import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class FlagSetSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'flagset',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['flagName'],
                    description: 'Returns `true` or `false`, depending on whether the specified case-sensitive flag code has been set or not.',
                    exampleCode: '{flagset;a} {flagset;_}',
                    exampleIn: 'Hello, -a world!',
                    exampleOut: 'true false',
                    returns: 'boolean',
                    execute: (ctx, [flagName]) => this.isFlagSet(ctx, flagName.value)
                }
            ]
        });
    }

    public isFlagSet(context: BBTagContext, flagName: string): boolean {
        if (!guard.isLetter(flagName) && flagName !== '_')
            return false;

        return context.flaggedInput[flagName] !== undefined;
    }
}
