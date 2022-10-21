import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.reactionuser;

export class ReactionUserSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'reactionuser',
            aliases: ['reactuser'],
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the user whos reaction that triggered {waitreact}',
                    exampleCode: '{waitreact;11111111111111111;{bool;{reactuser};==;3333333333333}}',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","✅"]',
                    returns: 'id',
                    execute: (ctx) => this.getReaction(ctx)
                }
            ]
        });
    }

    public getReaction(context: BBTagContext): string {
        const val = context.scopes.local.reactUser;
        if (val === undefined)
            throw new BBTagRuntimeError('{reactuser} can only be used inside {waitreaction}');
        return val;
    }
}
