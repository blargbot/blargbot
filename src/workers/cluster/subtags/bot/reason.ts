import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ReasonSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'reason',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['reason?'],
                    description: 'Sets the reason for the next API call (ex. roleadd, roleremove, ban, etc.). If `reason` is empty the reason will be empty',
                    exampleCode: '{reason;This will show up in the audit logs!}{roleadd;111111111111}',
                    exampleOut: '("This will show up in the audit logs" showed up)',
                    returns: 'nothing',
                    execute: (ctx, [reason]) => this.setReason(ctx, reason.value)
                }
            ]
        });
    }

    public setReason(context: BBTagContext, reason: string): void {
        context.scopes.local.reason = reason;

    }
}
