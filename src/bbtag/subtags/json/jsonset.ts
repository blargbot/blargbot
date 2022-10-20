import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { bbtag, SubtagType } from '../../utils';

export class JsonSetSubtag extends CompiledSubtag {
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
                    execute: (ctx, [input, path]) => this.setValue(ctx, input.value, path.value, undefined, false)
                },
                {
                    parameters: ['input:{}', 'path', 'value'],
                    description: 'Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. `input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.If `create` is not empty, will create/convert any missing keys.',
                    exampleCode: '{jsonset;;path.to.key;value;create}',
                    exampleOut: '{"path":{"to":{"key":"value"}}}',
                    returns: 'json|nothing',
                    execute: (ctx, [input, path, value]) => this.setValue(ctx, input.value, path.value, value.value, false)
                },
                {
                    parameters: ['input:{}', 'path', 'value', 'create?'],
                    description: 'Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. `input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.If `create` is not empty, will create/convert any missing keys.',
                    exampleCode: '{jsonset;;path.to.key;value;create}',
                    exampleOut: '{"path":{"to":{"key":"value"}}}',
                    returns: 'json|nothing',
                    execute: (ctx, [input, path, value]) => this.setValue(ctx, input.value, path.value, value.value, true)
                }
            ]
        });
    }

    public async setValue(
        context: BBTagContext,
        input: string,
        path: string,
        value: string | undefined,
        create: boolean
    ): Promise<JToken | undefined> {
        const target = await bbtag.json.resolveObj(context, input);

        bbtag.json.set(target.object, path, value, create);

        if (target.variable !== undefined) {
            await context.variables.set(target.variable, target.object);
            return undefined;
        }

        return target.object;
    }
}
