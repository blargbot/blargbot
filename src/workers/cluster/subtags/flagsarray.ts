import { BaseSubtag, BBTagContext, SubtagType } from '@cluster/core';

export class FlagsArraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'flagsarray',
            category: SubtagType.BOT,
            desc: 'Returns an array of all flags provided.',
            definition: [
                {
                    parameters: [],
                    exampleCode: '{flagsarray}',
                    exampleIn: 'Hello -dc world',
                    exampleOut: '["_","d","c"]',
                    execute: (ctx) => this.flagKeys(ctx)
                }
            ]
        });
    }

    public flagKeys(context: BBTagContext): string {
        return JSON.stringify(Object.keys(context.flaggedInput));
    }
}
