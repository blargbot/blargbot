import { Cluster } from '../Cluster';
import { BaseSubtag, BBTagContext, bbtagUtil, SubtagCall, SubtagType } from '../core';
import { guard } from '../core/globalCore';

export class ApplySubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'apply',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['subtag', 'args*'],
                    description:
                        'Executes `subtag`, using the `args` as parameters. ' +
                        'If `args` is an array, it will get deconstructed to it\'s individual elements.',
                    exampleCode: '{apply;randint;[1,4]}',
                    exampleOut: '3',
                    execute: (ctx, args, subtag) => this.defaultApply(ctx, args.map(a => a.value), subtag)
                }
            ]
        });
    }

    public async defaultApply(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const subtagClass = this.cluster.subtags.get(args[0].toLowerCase());
        if (subtagClass === undefined)
            return this.customError('No subtag found', context, subtag);

        const subtagArgs = args.slice(1);
        const flattenedArgs: string[][] = [];

        for (const arg of subtagArgs) {
            const arr = bbtagUtil.tagArray.deserialize(arg);
            if (arr !== undefined && Array.isArray(arr.v))
                flattenedArgs.push(
                    ...arr.v.map((i) =>
                        typeof i === 'object' || !guard.hasValue(i)
                            ? [JSON.stringify(i)]
                            : [i.toString()]
                    )
                );
            else flattenedArgs.push([arg]);
        }
        const subtagCall = {
            name: [subtagClass.name],
            args: flattenedArgs,
            start: subtag.start,
            end: subtag.end,
            get source(): string {
                return `{${args.join(';')}}`;
            }
        };

        return await context.engine.eval(subtagCall, context);
    }
}
