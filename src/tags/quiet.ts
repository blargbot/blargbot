
import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { parse, SubtagType } from '../utils';

export class QuietSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'quiet',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['isQuiet?:true'],
                    description: 'Tells any subtags that rely on a `quiet` field to be/not be quiet based on `isQuiet. `isQuiet` must be a boolean',
                    exampleCode: '{quiet} {usermention;cat}',
                    exampleOut: 'cat',
                    execute: (ctx, [{value: boolean}]) => {
                        ctx.scope.quiet = parse.boolean(boolean);
                    }
                }
            ]
        });
    }
}