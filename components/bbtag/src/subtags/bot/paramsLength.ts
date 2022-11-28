import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { BBTagRuntimeError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

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
