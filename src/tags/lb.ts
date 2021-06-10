/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:26
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:47:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class LbSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'lb',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by `{` on execution.',
            usage: '{lb}',
            exampleCode: 'This is a bracket! {lb}',
            exampleOut: 'This is a bracket! {',
            definition: [
                {
                    args: [],
                    description: 'Returns `[`',
                    execute: () => '['
                }
            ]
        });
    }
}