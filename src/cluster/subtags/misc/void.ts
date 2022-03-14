import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagType } from '@blargbot/cluster/utils';

export class VoidSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'void',
            category: SubtagType.MISC,
            aliases: ['null'],
            definition: [
                {
                    parameters: ['code*'],
                    description: 'Executes `code` but does not return the output from it. Useful for silent functionality',
                    exampleCode: '{void;This won\'t be output!}',
                    exampleOut: '',
                    returns: 'nothing',
                    execute: () => this.returnNothing()
                }
            ]
        });
    }

    public returnNothing(): void {
        /*NOOP*/
    }
}
