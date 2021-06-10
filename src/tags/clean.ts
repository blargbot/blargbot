/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:33
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-10 13:34:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class CleanSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'clean',
            category: SubtagType.COMPLEX,
            desc:
                'Removes all duplicated whitespace from `text`, meaning a cleaner output.',
            usage: '{clean;<text>}',
            exampleCode: '{clean;Hello!  \n\n  Im     here    to help}',
            exampleOut: 'Hello!\nIm here to help',
            definition: [
                {
                    args: ['text'],
                    description: 'Removes all duplicated whitespace from `text`, meaning a cleaner output.',
                    execute: (_, [text]) => this.clean(text.value)
                }
            ]
        });
    }

    public clean(text: string): string {
        return text.replace(/\s+/g, (match) => {
            if (match.indexOf('\n') !== -1) return '\n';
            if (match.indexOf('\t') !== -1) return '\t';
            return match.substr(0, 1);
        });
    }
}
