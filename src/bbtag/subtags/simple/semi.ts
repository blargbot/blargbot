import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.semi;

export class SemiSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'semi',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: () => this.getSemiColon()
                }
            ]
        });
    }

    public getSemiColon(): ';' {
        return ';';
    }
}
