/*
 * @Author: RagingLink
 * @Date: 2021-06-10 13:19:00
 * @Last Modified by:   RagingLink
 * @Last Modified time: 2021-06-10 13:19:00
 */

import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class Argslength extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'argslength',
            category: SubtagType.SIMPLE,
            desc: 'Return the number of arguments the user provided.',
            usage: '{argslength}',
            exampleCode: 'You said {argslength} words.',
            exampleIn: 'I am saying things.',
            exampleOut: 'You said 4 words.',
            definition: {
                default: (ctx) => ctx.input.length.toString()
            }
        });
    }
}
