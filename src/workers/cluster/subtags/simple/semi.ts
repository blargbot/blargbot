import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

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
