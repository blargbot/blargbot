import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class Base64DecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'base64Decode',
            aliases: ['aToB'],
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
