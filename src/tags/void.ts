/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:21:28
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:25:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class VoidSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'void',
            category: SubtagType.COMPLEX,
            desc: 'Executes `code` but does not return the output from it. Useful for silent functionality',
            usage: '{void;[code]}',
            exampleCode: '{void;This won\'t be output!}',
            exampleOut: '',
            definition: [
                {
                    args: ['code?'],
                    description: 'Silently executes `code`',
                    execute: () => ''
                }
            ]
        });
    }
}