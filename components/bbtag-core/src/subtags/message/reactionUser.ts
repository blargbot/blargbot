import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';

export class ReactionUserSubtag extends Subtag {
    public constructor() {
        super({
            name: 'reactionUser',
            aliases: ['reactUser'],
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
