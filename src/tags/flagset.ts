import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class FlagSetSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'flagset',
            category: SubtagType.BOT,
            definition: [
                {
                    args: ['code'],
                    description: 'Returns `true` or `false`, depending on whether the specified case-sensitive flag code has been set or not.',
                    exampleCode: '{flagset;a} {flagset;_}',
                    exampleIn: 'Hello, -a world!',
                    exampleOut: 'true false',
                    execute: (ctx, [{value: flagName}]) => (ctx.flaggedInput[flagName] !== undefined).toString()
                }
            ]
        });
    }
}