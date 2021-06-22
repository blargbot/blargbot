import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ReasonSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'reason',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['reason?'],
                    description: 'Sets the reason for the next API call (ex. roleadd, roleremove, ban, etc.). If `reason` is empty the reason will be empty',
                    exampleCode: '{reason;This will show up in the audit logs!}{roleadd;111111111111}',
                    exampleOut: '("This will show up in the audit logs" showed up)',
                    execute: (ctx, [reason]) => {
                        ctx.scope.reason = reason?.value;
                    }
                }
            ]
        });
    }
}