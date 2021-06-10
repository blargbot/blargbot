import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class Base64encodeSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'base64encode',
            aliases: ['btoa'],
            category: SubtagType.COMPLEX,
            desc: 'Converts the provided text to base64.',
            usage: '{base64decode;<text>}',
            exampleCode: '{base64decode;Fancy!}',
            exampleOut: 'RmFuY3kh!',
            definition: {
                whenArgCount: {
                    '1': (_, args, __) =>
                        this.encode(args.map((arg) => arg.value))
                }
            }
        });
    }

    public encode(args: string[]): string {
        const text = args[0];
        const b64 = Buffer.from(text).toString('base64');
        return b64;
    }
}