import { BBTagContext, Subtag, tagVariableScopes } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class GetSubtag extends Subtag {
    public constructor() {
        super({
            name: 'get',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name'],
                    description: 'Returns the stored variable `varName`.\n' +
                        'You can use a character prefix to determine the scope of your variable.\n' +
                        'Valid scopes are: ' + tagVariableScopes.map((s) => `${s.prefix.length === 0 ? 'no prefix' : `\`${s.prefix}\``} (${s.name})`).join(', ') +
                        '. For more information, use `b!t docs variable` or `b!cc docs variable`',
                    exampleCode: '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{get;var1}\n{get;~var2}',
                    exampleOut: 'This is local var1\nThis is temporary var2',
                    returns: 'json|nothing',
                    execute: async (ctx, [name]) => await this.get(ctx, name.value)
                },
                {
                    parameters: ['name', 'index'],
                    description: 'When variable `name` is an array this will return the element at index `index`.' +
                        ' If `index` is empty the entire array will be returned. If variable is not an array it will return the whole variable.',
                    returns: 'json|nothing',
                    execute: async (ctx, [name, index]) => await this.getArray(ctx, name.value, index.value)
                }
            ]
        });
    }

    public async get(context: BBTagContext, variableName: string): Promise<JToken | undefined> {
        const arr = await bbtagUtil.tagArray.getArray(context, variableName);
        if (arr !== undefined)
            return JSON.stringify(arr);
        return await context.variables.get(variableName);
    }

    public async getArray(context: BBTagContext, variableName: string, index: string | number): Promise<JToken | undefined> {
        const result = await context.variables.get(variableName);
        if (!Array.isArray(result)) {
            return result;
        }

        if (index === '')
            return bbtagUtil.tagArray.serialize(result);

        index = parse.int(index);
        if (isNaN(index))
            throw new NotANumberError(index);

        if (index < 0 || index >= result.length)
            throw new BBTagRuntimeError('Index out of range');

        return result[index];
    }
}
