import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.escapebbtag;

export class EscapeBbtagSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'escapebbtag',
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
