import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.escapeBBTag;

@Subtag.id('escapeBBTag', 'escape')
@Subtag.ctorArgs()
export class EscapeBBTagSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['~input*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, items) => this.escape(items.map(i => i.code.ast.source).join(';'))
                }
            ]
        });
    }

    public escape(text: string): string {
        return text;
    }
}
