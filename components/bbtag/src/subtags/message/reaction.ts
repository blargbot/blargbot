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
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
