import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.semi;

@Subtag.names('semi')
@Subtag.ctorArgs()
export class SemiSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
