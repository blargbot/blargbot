import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class HashSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'hash',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description:
                        'Returns the numeric hash of `text`, based on the unicode value of each individual character. ' +
                        'This results in seemingly randomly generated numbers that are constant for each specific query.',
                    exampleCode: 'The hash of brown is {hash;brown}.',
                    exampleOut: 'The hash of brown is 94011702.',
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
