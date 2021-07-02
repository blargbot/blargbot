import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class CleanSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'clean',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Removes all duplicated whitespace from `text`, meaning a cleaner output.',
                    exampleCode: '{clean;Hello!  \n\n  Im     here    to help}',
                    exampleOut: 'Hello!\nIm here to help',
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
