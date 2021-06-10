/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:26
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:48:10
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class SemiSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'semi',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by `;` on execution.',
            usage: '{semi}',
            exampleCode: 'This is a semicolon! {semi}',
            exampleOut: 'This is a semicolon! ;',
            definition: [
                {
                    args: [],
                    description: 'Returns `;`',
                    execute: () => ';'
                }
            ]
        });
    }
}