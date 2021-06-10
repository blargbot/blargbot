/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:48
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:22:55
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ZwsSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'zws',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by a single zero width space (unicode 200B)',
            usage: '{zws}',
            exampleCode: '{zws}',
            exampleOut: '\u200B',
            definition: {
                whenArgCount:{
                    '0': () => '\u200B'
                }
            }
        });
    }
}