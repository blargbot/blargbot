import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.paramsLength;

export class ParamsLengthSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'paramsLength',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx) => this.getParamsLength(ctx)
                }
            ]
        });
    }

    public getParamsLength(context: BBTagContext): number {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{paramslength} can only be used inside {function}');
        return params.length;
    }
}
