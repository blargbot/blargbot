import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.paramsLength;

@Subtag.id('paramsLength')
@Subtag.ctorArgs()
export class ParamsLengthSubtag extends CompiledSubtag {
    public constructor() {
        super({
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

    public getParamsLength(context: BBTagScript): number {
        const params = context.runtime.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{paramslength} can only be used inside {function}');
        return params.length;
    }
}
