import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class Base64decodeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'base64decode',
            aliases: ['atob'],
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text+'],
                    description: 'Converts the provided base64 to a UTF-8 string.',
                    exampleCode: '{base64decode;RmFuY3kh}',
                    exampleOut: 'Fancy!',
                    execute: (_, args) => this.decode(args.map(arg => arg.value))
                }
            ]
        });
    }

    public decode(args: string[]): string {
        const b64 = args[0];
        const text = Buffer.from(b64, 'base64').toString();
        return text;
    }
}
