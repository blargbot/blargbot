import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.reaction;

export class ReactionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'reaction',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the reaction that triggered {waitreact}',
                    exampleCode: '{waitreact;11111111111111111;{bool;{reaction};==;✅}}',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","✅"]',
                    returns: 'string',
                    execute: (ctx) => this.getReaction(ctx)
                }
            ]
        });
    }

    public getReaction(context: BBTagContext): string {
        const val = context.scopes.local.reaction;
        if (val === undefined)
            throw new BBTagRuntimeError('{reaction} can only be used inside {waitreaction}');
        return val;
    }
}
