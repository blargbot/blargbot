import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class Argslength extends Subtag {
    public constructor() {
        super({
            name: 'argslength',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: 'Return the number of arguments the user provided.',
                    exampleCode: 'You said {argslength} words.',
                    exampleIn: 'I am saying things.',
                    exampleOut: 'You said 4 words.',
                    returns: 'number',
                    execute: (ctx) => this.getArgsLength(ctx)
                }
            ]
        });
    }

    public getArgsLength(context: BBTagContext): number {
        return context.input.length;
    }
}
