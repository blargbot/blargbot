import { Cluster } from '../cluster';
import { BaseSubtag, RuntimeContext, SubtagCall } from '../core/bbtag';
import { SubtagType, bbtagUtil } from '../utils';

export class ApplySubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'apply',
            category: SubtagType.ARRAY,
            desc:
                'Executes `subtag`, using the `args` as parameters. ' +
                'If `args` is an array, it will get deconstructed to it\'s individual elements.',
            usage: '{apply;<subtag>;[args...]',
            exampleCode: '{apply;randint;[1,4]}',
            exampleOut: '3',
            definition: {
                whenArgCount: {
                    '0': (ctx, _, subtag) =>
                        this.notEnoughArguments(ctx, subtag)
                },
                default: (ctx, args, subtag) =>
                    this.defaultApply(
                        ctx,
                        args.map((arg) => arg.value),
                        subtag
                    )
            }
        });
    }

    public async defaultApply(
        context: RuntimeContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const subtagClass = this.cluster.subtags.get(args[0].toLowerCase());
        if (!subtagClass)
            return this.customError('No subtag found', context, subtag);

        const subtagArgs = args.slice(1);
        const flattenedArgs: string[][] = [];

        for (const arg of subtagArgs) {
            const arr = bbtagUtil.tagArray.deserialize(arg);
            if (arr != null && Array.isArray(arr.v))
                flattenedArgs.push(
                    ...arr.v.map((i) =>
                        typeof i === 'object'
                            ? [JSON.stringify(i)]
                            : [i!.toString()]
                    )
                );
            else flattenedArgs.push([arg]);
        }
        const subtagCall = {
            name: [subtagClass.name],
            args: flattenedArgs,
            start: subtag.start,
            end: subtag.end
        };

        return await context.engine.eval(subtagCall, context);
    }
}
