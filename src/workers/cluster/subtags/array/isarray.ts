import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class IsArraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'isarray',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Determines whether `text` is a valid array.',
                    exampleCode: '{isarray;["array?"]} {isarray;array?}',
                    exampleOut: 'true false',
                    execute: (_, [{ value }]) => this.isArray(value).toString()
                }
            ]
        });
    }

    public isArray(value: string): boolean {
        const input = bbtagUtil.tagArray.deserialize(value);
        return input !== undefined && Array.isArray(input.v);
    }
}
