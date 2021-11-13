import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';
import { ReturnObject } from '@cluster/utils/bbtag/json';

const json = bbtagUtil.json;

export class JsonSetSubtag extends Subtag {
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
                    returns: 'json|nothing',
                    execute: (ctx, [input, path]) => this.deleteValue(ctx, input.value, path.value)
                },
                {
                    parameters: ['input:{}', 'path', 'value', 'create?'],
                    description: 'Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. ' +
                        '`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.' +
                        'If `create` is not empty, will create/convert any missing keys.',
                    exampleCode: '{jsonset;;path.to.key;value;create}',
                    exampleOut: '{"path":{"to":{"key":"value"}}}',
                    returns: 'json|nothing',
                    execute: (ctx, [input, path, value, create]) => this.setValue(ctx, input.value, path.value, value.value, create.value)
                }
            ]
        });
    }

    public async deleteValue(
        context: BBTagContext,
        input: string,
        path: string
    ): Promise<JToken | undefined> {
        let obj: JArray | JObject | ReturnObject;
        try {
            let varname: string | undefined;
            const arr = await bbtagUtil.tagArray.getArray(context, input);
            if (arr !== undefined)
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
            } else
                return modifiedObj;
            return undefined;
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw e;
        }
    }

    public async setValue(
        context: BBTagContext,
        input: string,
        path: string,
        value: string,
        createStr: string
    ): Promise<JToken | undefined> {
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
            } else
                return modifiedObj;
            return undefined;
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw e;
        }
    }
}
