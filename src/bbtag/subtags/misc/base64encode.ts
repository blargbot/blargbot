import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class Base64EncodeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'base64encode',
            aliases: ['btoa'],
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Converts the provided text to base64.',
                    exampleCode: '{base64decode;Fancy!}',
                    exampleOut: 'RmFuY3kh!',
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
