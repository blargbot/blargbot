import type { BBTagScript } from '../../BBTagScript.js';
import type { BBTagStatement } from '../../BBTagStatement.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.function;

@Subtag.id('function', 'func')
@Subtag.ctorArgs()
export class FunctionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [name, code]) => this.createFunction(ctx, name.value, code.code)
                }
            ]
        });
    }

    public createFunction(
        context: BBTagScript,
        funcName: string,
        code: BBTagStatement
    ): void {
        let name: string = funcName.toLowerCase();
        if (name.startsWith('func.'))
            name = name.slice(5);

        if (name === '')
            throw new BBTagRuntimeError('Must provide a name');

        context.runtime.defineSnippet(`func.${name}`, code.ast);
    }
}
