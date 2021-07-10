import { BaseSubtag, BBTagContext, SubtagType } from '../core';
import { guard } from '../core/globalCore';

export class FlagSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'flag',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['flagName'],
                    description: 'Returns the value of the specified case-sensitive flag code. Use `_` to get the values without a flag.',
                    exampleCode: '{flag;a} {flag;_}',
                    exampleIn: 'Hello, -a world!',
                    exampleOut: 'world! Hello,',
                    execute: (ctx, [{ value: flagName }]) => this.getFlag(ctx, flagName)
                }
            ]
        });
    }

    public getFlag(context: BBTagContext, flagName: string): string {
        if (guard.isLetter(flagName) || flagName === '_')
            return context.flaggedInput[flagName]?.merge().value ?? '';
        return '';
    }
}
