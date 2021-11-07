import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class ReactionUserSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'reactuser',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the user whos reaction that triggered {waitreact}',
                    exampleCode: '{waitreact;11111111111111111;{bool;{reactuser};==;3333333333333}}',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","✅"]',
                    execute: (ctx, _, subtag) => this.getReaction(ctx, subtag)
                }
            ]
        });
    }

    public getReaction(context: BBTagContext, subtag: SubtagCall): string {
        return context.scopes.local.reaction ?? context.addError('{reactuser} can only be used inside {waitreaction}', subtag);
    }
}
