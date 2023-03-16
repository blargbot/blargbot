import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.reactionUser;

@Subtag.id('reactionUser', 'reactUser')
@Subtag.ctorArgs()
export class ReactionUserSubtag extends CompiledSubtag {
    public constructor() {
        super({
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

    public getReaction(context: BBTagScript): string {
        const val = context.runtime.scopes.local.reactUser;
        if (val === undefined)
            throw new BBTagRuntimeError('{reactuser} can only be used inside {waitreaction}');
        return val;
    }
}
