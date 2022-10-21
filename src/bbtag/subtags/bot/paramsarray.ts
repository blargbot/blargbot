import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.paramsarray;

export class ParamsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'paramsarray',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]',
                    execute: (ctx) => this.getParamsArray(ctx)
                }
            ]
        });
    }

    public getParamsArray(context: BBTagContext): readonly string[] {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{paramsarray} can only be used inside {function}');
        return params;
    }
}
