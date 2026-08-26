import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

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
