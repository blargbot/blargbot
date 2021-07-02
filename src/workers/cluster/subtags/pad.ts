import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext, SubtagCall } from '../core';

export class PadSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'pad',
            category: SubtagType.COMPLEX,
            deprecated: 'realpad',
            definition: [
                {
                    parameters: ['direction', 'back', 'text'],
                    description: 'Places `text` ontop of `back` with it being aligned to the opposite of `direction`. If `text` is longer than `back` then it will simply overlap',
                    exampleCode: '{pad;left;000000;ABC}',
                    exampleOut: '000ABC',
                    execute: (ctx, args, subtag) => this.pad(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public pad(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): string {
        const direction = args[0],
            backing = args[1],
            overlay = args[2];

        if (direction.toLowerCase() == 'left')
            return backing.substr(0, backing.length - overlay.length) + overlay;
        if (direction.toLowerCase() == 'right')
            return overlay + backing.substr(overlay.length);
        return this.customError('Invalid direction', context, subtag);
    }
}