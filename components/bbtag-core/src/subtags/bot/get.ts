import { parse } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { tagVariableScopeProviders } from '../../tagVariableScopeProviders.js';

export class GetSubtag extends Subtag {
    public constructor() {
        super({
            name: 'get',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name'],
                    description: tag.value.description({ scopes: tagVariableScopeProviders }),
                    exampleCode: tag.value.exampleCode,
                    exampleOut: tag.value.exampleOut,
                    returns: 'json|nothing',
                    execute: async (ctx, [name]) => await this.get(ctx, name.value)
                },
                {
                    parameters: ['name', 'index'],
                    description: tag.index.description,
                    exampleCode: tag.index.exampleCode,
                    exampleOut: tag.index.exampleOut,
                    returns: 'json|nothing',
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

        if (indexStr === '')
            return { v: result.value, n: result.key };

        const index = parse.int(indexStr);
        if (index === undefined)
            throw new NotANumberError(indexStr);

        if (index < 0 || index >= result.value.length)
            throw new BBTagRuntimeError('Index out of range');

        return result.value[index];
    }
}
