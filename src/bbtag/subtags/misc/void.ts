import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.void;

export class VoidSubtag extends CompiledSubtag {
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
