import { BaseSubtag, SubtagType } from '@cluster/core';

export class LbSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'lb',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by `{` on execution.',
            definition: [
                {
                    parameters: [],
                    description: 'Returns `{`',
                    exampleCode: 'This is a bracket! {lb}',
                    exampleOut: 'This is a bracket! {',
                    execute: () => '{'
                }
            ]
        });
    }
}
