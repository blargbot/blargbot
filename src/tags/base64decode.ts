/*
 * @Author: RagingLink
 * @Date: 2021-06-10 13:19:09
 * @Last Modified by:   RagingLink
 * @Last Modified time: 2021-06-10 13:19:09
 */

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class Base64decodeSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'base64decode',
            aliases: ['atob'],
            category: SubtagType.COMPLEX,
            desc: 'Converts the provided base64 to a UTF-8 string.',
            usage: '{base64decode;<base64>}',
            exampleCode: '{base64decode;RmFuY3kh',
            exampleOut: 'Fancy!',
            definition: {
                whenArgCount: {
                    '1': (_, args, __) =>
                        this.decode(args.map((arg) => arg.value))
                }
            }
        });
    }

    public decode(args: string[]): string {
        const b64 = args[0];
        const text = Buffer.from(b64, 'base64').toString();
        return text;
    }
}
