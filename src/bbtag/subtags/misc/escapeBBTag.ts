import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.escapeBBTag;

export class EscapeBBTagSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'escapeBBTag',
            category: SubtagType.MISC,
            aliases: ['escape'],
            definition: [
                {
                    parameters: ['~input*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, items) => this.escape(items.map(i => i.code.source).join(';'))
                }
            ]
        });
    }

    public escape(text: string): string {
        return text;
    }
}
