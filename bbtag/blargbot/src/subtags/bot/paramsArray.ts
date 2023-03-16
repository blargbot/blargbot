import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.paramsArray;

@Subtag.id('paramsArray')
@Subtag.ctorArgs()
export class ParamsArraySubtag extends CompiledSubtag {
    public constructor() {
        super({
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

    public getParamsArray(context: BBTagScript): readonly string[] {
        const params = context.runtime.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{paramsarray} can only be used inside {function}');
        return params;
    }
}
