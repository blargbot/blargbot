import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class VoidSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'void',
            category: SubtagType.COMPLEX,
            aliases: ['null'],
            definition: [
                {
                    parameters: ['code?'],
                    description: 'Executes `code` but does not return the output from it. Useful for silent functionality',
                    exampleCode: '{void;This won\'t be output!}',
                    exampleOut: '',
                    execute: () => ''
                }
            ]
        });
    }
}
