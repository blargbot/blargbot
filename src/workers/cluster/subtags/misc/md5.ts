import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import md5 from 'md5';

export class Md5Subtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'md5',
            aliases: ['md5encode'],
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Converts the provided text to md5.',
                    exampleCode: '{md5;Woosh whap phew!}',
                    exampleOut: '71d97a11f770a34d7f8cf1f1d8749d85',
                    execute: (_, [{ value: text }]) => md5(text)
                }
            ]
        });
    }
}
