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
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
