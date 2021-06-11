import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class Base64decodeSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'base64decode',
            aliases: ['atob'],
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['text+'],
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
