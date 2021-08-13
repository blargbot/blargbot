import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class SplitSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'split',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['text', 'splitter?'],
                    description: 'Splits `text` using `splitter`, and the returns an array.',
                    exampleCode: '{split;Hello! This is a sentence.;{space}}',
                    exampleOut: '["Hello!","This","is","a","sentence."]',
                    execute: (_, [{value: text}, {value: splitter}]) => bbtagUtil.tagArray.serialize(text.split(splitter))

                }
            ]
        });
    }
}
