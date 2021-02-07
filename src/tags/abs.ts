import { Cluster } from '../cluster';
import { BaseSubtagHandler, arg, Type } from '../structures/BaseSubtagHandler';

export class AbsSubtag extends BaseSubtagHandler {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'abs', {
            category: Type.COMPLEX,
            aliases: ['absolute'],
            acceptsArrays: true,
            args: [arg.required('number', 'any', true)],
            desc: 'Gets the absolute value of `number`. If multiple are supplied, then an array will be returned',
            exampleCode: '{abs;-535}',
            exampleOut: '535'
        });

        this.whenArgs(0, 'notEnoughArguments')
            .whenArgs(1, 'handleOne')
            .default('handleMany');
    }

    public handleOne(): string {
        /*
            let values = Builder.util.flattenArgArrays(args).map(parse.float);
            if (values.filter(isNaN).length > 0)
                return Builder.errors.notANumber(subtag, context);
            values = values.map(Math.abs);
            if (values.length == 1)
                return values[0];
            return tagArray.serialize(values);
        */
        return 'WIP';
    }

    public handleMany(): string[] {
        return ['WIP', 'WIP'];
    }
}