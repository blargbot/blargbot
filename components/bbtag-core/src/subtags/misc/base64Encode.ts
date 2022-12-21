import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class Base64EncodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'base64Encode',
            aliases: ['bToA'],
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
