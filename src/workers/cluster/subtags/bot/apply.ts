import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, UnknownSubtagError } from '@cluster/bbtag/errors';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil, guard, SubtagType } from '@cluster/utils';

export class ApplySubtag extends Subtag {
    public constructor() {
        super({
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
                    returns: 'string',
                    execute: (ctx, [subtagName, ...args], subtag) => this.defaultApply(ctx, subtagName.value, args.map(a => a.value), subtag)
                }
            ]
        });
    }

    public async defaultApply(
        context: BBTagContext,
        subtagName: string,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        try {
            context.getSubtag(subtagName.toLowerCase());
        } catch (error: unknown) {
            if (!(error instanceof UnknownSubtagError))
                throw error;
            throw new BBTagRuntimeError('No subtag found');
        }

        const flattenedArgs: Array<readonly string[]> = [];

        for (const arg of args) {
            const arr = bbtagUtil.tagArray.deserialize(arg);
            if (arr !== undefined) {
                flattenedArgs.push(
                    ...arr.v.map((i) =>
                        typeof i === 'object' || !guard.hasValue(i)
                            ? [JSON.stringify(i)]
                            : [i.toString()]
                    )
                );
            } else
                flattenedArgs.push([arg]);
        }

        return await context.eval([{
            name: [subtagName.toLowerCase()],
            args: flattenedArgs,
            start: subtag.start,
            end: subtag.end,
            get source(): string {
                return `{${args.join(';')}}`;
            }
        }]);
    }
}
