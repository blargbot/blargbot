import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class CommandNameSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'commandname',
            category: SubtagType.BOT,
            desc: 'Gets the name of the current tag or custom command. Will throw an error in other instances.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This command is {commandname}',
                    exampleIn: 'b!cc test',
                    exampleOut: 'This command is test',
                    execute: (ctx, _, subtag) => ctx.tagName || this.customError('Not a command', ctx, subtag)
                }
            ]
        });
    }
}