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
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
