import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.base64encode;

export class Base64EncodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'base64encode',
            aliases: ['btoa'],
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.encode(text.value)
                }
            ]
        });
    }

    public encode(text: string): string {
        return Buffer.from(text).toString('base64');
    }
}
