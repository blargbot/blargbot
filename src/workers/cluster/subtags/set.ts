import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext, tagVariableScopes, bbtagUtil } from '../core';

export class SetSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'set',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['name'],
                    description: 'Sets the `name` variable to nothing.',
                    exampleCode: '{set;~var;something}\n{set;~var}\n{get;~var}',
                    exampleOut: '(returns nothing)',
                    execute: async (ctx, [{ value: variableName }]) => await ctx.variables.set(variableName, undefined)
                },
                {
                    parameters: ['name', 'value'],
                    description:
                        'Stores `value` under `name`. These variables are saved between sessions. ' +
                        'You can use a character prefix to determine the scope of your variable.\n' +
                        'Valid scopes are: ' + tagVariableScopes.map((s) => '`' + (s.prefix || 'none') + '` (' + s.name + ')').join(', ') +
                        '.\nFor performance reasons, variables are not immediately stored to the database. See `{commit}` and `{rollback}`' +
                        'for more information, or use `b!t docs variable` or `b!cc docs variable`',
                    exampleCode:
                        '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{get;var1}\n{get;~var2}',
                    exampleOut: 'This is local var1\nThis is temporary var2',
                    execute: async (ctx, [{ value: variableName }, { value }]) => await this.set(ctx, variableName, value)
                },
                {
                    parameters: ['name', 'values+2'],
                    description:
                        'Stores an array under `name`.' +
                        '\nWhen getting the array, you\'ll notice it retrieved an object, ' +
                        'In this object `v` is the array itself, and `n` is the `name` of the variable. ' +
                        'If the array itself needs to be returned instead of object, in for example `{jset;;array;{get;~array}}`, you can use `{slice;<arrayname>;0}`. In array subtags `{get} will work as intended.`',
                    exampleCode: '{set;var3;this;is;an;array}\n{get;var3}',
                    exampleOut: '{"v":["this","is","an","array"],"n":"var3"}',
                    execute: async (ctx, args) => await this.setArray(ctx, args[0].value, args.slice(1).map((arg) => arg.value))
                }
            ]
        });
    }

    public async set(
        context: BBTagContext,
        variableName: string,
        value: string
    ): Promise<void> {
        const deserializedArray = bbtagUtil.tagArray.deserialize(value);
        if (deserializedArray && Array.isArray(deserializedArray.v)) {
            await context.variables.set(variableName, deserializedArray.v);
        } else {
            await context.variables.set(variableName, value);
        }
    }

    public async setArray(
        context: BBTagContext,
        variableName: string,
        arrayElements: string[]
    ): Promise<void> {
        const result = [];
        for (let i = 0; i < arrayElements.length; i++) {
            try {
                result.push(JSON.parse(arrayElements[i]));
            } catch (e) {
                result.push(arrayElements[i]);
            }
        }
        await context.variables.set(variableName, result);
    }
}
