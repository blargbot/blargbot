import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class Base64encodeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'base64encode',
            aliases: ['btoa'],
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text+'],
                    description: 'Converts the provided text to base64.',
                    exampleCode: '{base64decode;Fancy!}',
                    exampleOut: 'RmFuY3kh!',
                    execute: (_, args) => this.encode(args.map(arg => arg.value))
                }
            ]
        });
    }

    public encode(args: string[]): string {
        const text = args[0];
        const b64 = Buffer.from(text).toString('base64');
        return b64;
    }
}
