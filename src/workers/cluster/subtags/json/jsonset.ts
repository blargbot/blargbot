import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';
import { ReturnObject } from '@cluster/utils/bbtag/json';

const json = bbtagUtil.json;

export class JsonSetSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonset',
            category: SubtagType.JSON,
            aliases: ['jset'],
            definition: [
                {
                    parameters: ['input:{}', 'path'],
                    description: 'Deletes the value at `path`. `input` can be a JSON object or array',
                    exampleCode: '{set;~json;{json;{"key" : "value"}}}\n{jset;~json;key}\n{get;~json}',
                    exampleOut: '{}',
                    execute: async (ctx, args) => this.deleteValue(ctx, args[0].value, args[1].value)
                },
                {
                    parameters: ['input:{}', 'path', 'value', 'create?'],
                    description: 'Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. ' +
                        '`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.' +
                        'If `create` is not empty, will create/convert any missing keys.',
                    exampleCode: '{jsonset;;path.to.key;value;create}',
                    exampleOut: '{"path":{"to":{"key":"value"}}}',
                    execute: async (ctx, args) => this.setValue(ctx, args[0].value, args[1].value, args[2].value, args[3].value)
                }
            ]
        });
    }

    public async deleteValue(
        context: BBTagContext,
        input: string,
        path: string
    ): Promise<string | void> {
        let obj: JArray | JObject | ReturnObject;
        try {
            let varname: string | undefined;
            const arr = await bbtagUtil.tagArray.getArray(context, input);
            if (arr !== undefined && Array.isArray(arr.v))
                obj = arr.v;
            else {
                const parsedObject = await json.parse(context, input);
                if (parsedObject.variable !== undefined)
                    varname = parsedObject.variable;
                obj = parsedObject.object;
            }
            const modifiedObj = json.set(obj, path, undefined);
            if (arr?.n !== undefined) {
                await context.variables.set(arr.n, obj);
            } else if (varname !== undefined) {
                await context.variables.set(varname, JSON.stringify(modifiedObj));
            } else return JSON.stringify(modifiedObj);
        } catch (e: unknown) {
            context.logger.error(e);
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
        }
    }

    public async setValue(
        context: BBTagContext,
        input: string,
        path: string,
        value: string,
        createStr: string
    ): Promise<string | void> {
        const create = createStr !== '' ? true : false;
        let obj: JArray | JObject | ReturnObject;
        try {
            let varname: string | undefined;
            const arr = await bbtagUtil.tagArray.getArray(context, input);
            if (arr !== undefined && Array.isArray(arr.v))
                obj = arr.v;
            else {
                const parsedObject = await json.parse(context, input);
                if (parsedObject.variable !== undefined)
                    varname = parsedObject.variable;
                obj = parsedObject.object;
            }
            const modifiedObj = json.set(obj, path, value, create);
            if (arr?.n !== undefined) {
                await context.variables.set(arr.n, obj);
            } else if (varname !== undefined) {
                await context.variables.set(varname, JSON.stringify(modifiedObj));
            } else return JSON.stringify(modifiedObj);
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
        }
    }
}
