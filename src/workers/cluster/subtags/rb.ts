import { BaseSubtag, SubtagType } from '@cluster/core';

export class RbSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rb',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns `}`',
                    exampleCode: 'This is a bracket! {rb}',
                    exampleOut: 'This is a bracket! }',
                    execute: () => '}'
                }
            ]
        });
    }
}
