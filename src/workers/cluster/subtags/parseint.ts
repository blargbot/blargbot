import { Cluster } from '../Cluster';
import { BaseSubtag, parse, SubtagType } from '../core';

export class ParseIntSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'parseint',
            category: SubtagType.COMPLEX,
            aliases: ['absolute'],
            definition: [
                {
                    parameters: ['number'],
                    description: 'Returns an integer from `text`. If it wasn\'t a number, returns `NaN`.',
                    exampleCode: '{parseint;abcd} {parseint;1234} {parseint;12cd}',
                    exampleOut: 'NaN 1234 12',
                    execute: (_, [{ value: text }]) => {
                        const number = parse.int(text);
                        if (isNaN(number))
                            return 'NaN';
                        return number.toString();
                    }
                }
            ]
        });
    }
}
