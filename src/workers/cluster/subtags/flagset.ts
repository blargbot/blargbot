import { BaseSubtag, SubtagType } from '../core';

export class FlagSetSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'flagset',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['code'],
                    description: 'Returns `true` or `false`, depending on whether the specified case-sensitive flag code has been set or not.',
                    exampleCode: '{flagset;a} {flagset;_}',
                    exampleIn: 'Hello, -a world!',
                    exampleOut: 'true false',
                    execute: (ctx, [{ value: flagName }]) => (ctx.flaggedInput[flagName] !== undefined).toString()
                }
            ]
        });
    }
}
