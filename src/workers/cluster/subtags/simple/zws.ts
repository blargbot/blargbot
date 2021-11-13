import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ZwsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'zws',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns a single zero width space (unicode 200B)',
                    exampleCode: '{zws}',
                    exampleOut: '\u200B',
                    returns: 'string',
                    execute: () => '\u200B'
                }
            ]
        });
    }
}
