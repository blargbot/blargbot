import { BaseSubtag, SubtagType } from '@cluster/core';

export class SemiSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'semi',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns `;`',
                    exampleCode: 'This is a semicolon! {semi}',
                    exampleOut: 'This is a semicolon! ;',
                    execute: () => ';'
                }
            ]
        });
    }
}
