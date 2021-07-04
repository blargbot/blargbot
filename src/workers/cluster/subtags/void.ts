import { BaseSubtag, SubtagType } from '../core';

export class VoidSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'void',
            category: SubtagType.COMPLEX,
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
