import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class IsccSubtag extends Subtag {
    public constructor() {
        super({
            name: 'iscc',
            category: SubtagType.SIMPLE,
            desc: 'Checks if the tag is being run from within a cc. Returns a boolean (`true` or `false`)',
            definition: [
                {
                    parameters: [],
                    exampleCode: '{if;{iscc};{dm;{userid};You have mail!};Boo, this only works in cc\'s}',
                    exampleOut: 'Boo, this only works in cc\'s',
                    returns: 'boolean',
                    execute: (ctx) => ctx.isCC
                }
            ]
        });
    }
}
