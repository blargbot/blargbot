import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';
import { default as Brainfuck } from 'brainfuck-node';
const bfClient = new Brainfuck();

export class BrainFuckSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'brainfuck',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['code', 'input?'],
                    description: 'Interprets `code` as brainfuck, using `input` as the text for `,`.',
                    exampleCode: '{brainfuck;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}',
                    exampleOut: 'Hello World!',
                    execute: (ctx, [code, input], subtag) => {
                        try {
                            return bfClient.execute(code.value, input.value).output;
                        } catch (e: unknown) {
                            if (e instanceof Error)
                                return this.customError(e.message, ctx, subtag);
                            return this.customError('Unexpected error from brainfuck', ctx, subtag);
                        }
                    }
                }
            ]
        });
    }
}