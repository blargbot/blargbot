import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { Statement } from '../../language';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.function;

export class FunctionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'function',
            category: SubtagType.BOT,
            aliases: ['func'],
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
        context: BBTagContext,
        funcName: string,
        code: Statement
    ): void {
        let name: string = funcName.toLowerCase();
        if (name.startsWith('func.'))
            name = name.slice(5);

        if (name === '')
            throw new BBTagRuntimeError('Must provide a name');

        context.scopes.root.functions[name] = code;
    }
}
