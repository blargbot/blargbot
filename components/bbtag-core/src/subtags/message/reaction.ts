import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';

export class ReactionSubtag extends Subtag {
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
