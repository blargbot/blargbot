import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError } from '../../errors';
import { tagVariableScopeProviders } from '../../tagVariableScopeProviders';
import { SubtagType } from '../../utils';

export class GetSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `get`,
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [`name`],
                    description: `Returns the stored variable \`varName\`.\nYou can use a character prefix to determine the scope of your variable.\nValid scopes are: ${tagVariableScopeProviders.map((s) => `${s.prefix.length === 0 ? `no prefix` : `\`${s.prefix}\``} (${s.name})`).join(`, `)
                        }. For more information, use \`b!t docs variable\` or \`b!cc docs variable\``,
                    exampleCode: `{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{get;var1}\n{get;~var2}`,
                    exampleOut: `This is local var1\nThis is temporary var2`,
                    returns: `json|nothing`,
                    execute: async (ctx, [name]) => await this.get(ctx, name.value)
                },
                {
                    parameters: [`name`, `index`],
                    description: `When variable \`name\` is an array this will return the element at index \`index\`. If \`index\` is empty the entire array will be returned. If variable is not an array it will return the whole variable.`,
                    exampleCode: `{set;myArray;["abc","def","ghi"]}{get;myArray;1}`,
                    exampleOut: `def`,
                    returns: `json|nothing`,
                    execute: async (ctx, [name, index]) => await this.getArray(ctx, name.value, index.value)
                }
            ]
        });
    }

    public async get(context: BBTagContext, variableName: string): Promise<JToken | undefined> {
        const result = await context.variables.get(variableName);
        if (!Array.isArray(result.value))
            return result.value;

        return { v: result.value, n: result.key };
    }

    public async getArray(context: BBTagContext, variableName: string, indexStr: string): Promise<JToken | undefined> {
        const result = await context.variables.get(variableName);
        if (!Array.isArray(result.value))
            return result.value;

        if (indexStr === ``)
            return { v: result.value, n: result.key };

        const index = parse.int(indexStr);
        if (index === undefined)
            throw new NotANumberError(indexStr);

        if (index < 0 || index >= result.value.length)
            throw new BBTagRuntimeError(`Index out of range`);

        return result.value[index];
    }
}
