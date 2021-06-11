import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class Base64encodeSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'base64encode',
            aliases: ['btoa'],
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['text+'],
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