/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:35
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:44:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class HashSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'hash',
            category: SubtagType.COMPLEX,
            desc:
                'Returns the numeric hash of `text`, based on the unicode value of each individual character. ' +
                'This results in seemingly randomly generated numbers that are constant for each specific query.',
            usage: '{hash;<text>}',
            exampleCode: 'The hash of brown is {hash;brown}.',
            exampleOut: 'The hash of brown is 94011702.',
            definition: [
                {
                    args: ['text'],
                    description:
                        'Returns the numeric hash of `text`, based on the unicode value of each individual character. ' +
                        'This results in seemingly randomly generated numbers that are constant for each specific query.',
                    execute: (_, [text]) => this.computeHash(text.value)
                }
            ]
        });
    }

    public computeHash(text: string): string {
        return text.split('')
            .reduce(function (a, b) {
                a = (a << 5) - a + b.charCodeAt(0);
                return a & a;
            }, 0)
            .toString();
    }
}
