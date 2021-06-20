import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class FlagSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'flag',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['code'],
                    description: 'Returns the value of the specified case-sensitive flag code. Use `_` to get the values without a flag.',
                    exampleCode: '{flag;a} {flag;_}',
                    exampleIn: 'Hello, -a world!',
                    exampleOut: 'world! Hello,',
                    execute: (ctx, [{ value: flagName }]) => (ctx.flaggedInput[flagName] ?? '').toString()
                }
            ]
        });
    }
}