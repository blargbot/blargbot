import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.base64decode;

export class Base64DecodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'base64decode',
            aliases: ['atob'],
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.decode(text.value)
                }
            ]
        });
    }

    public decode(base64: string): string {
        return Buffer.from(base64, 'base64').toString();
    }
}
