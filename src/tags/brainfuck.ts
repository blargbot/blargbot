import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';
import { default as Brainfuck } from 'brainfuck-node';//TODO types
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
                        } catch (e) {
                            return this.customError(e.message, ctx, subtag);
                        }
                    }
                }
            ]
        });
    }
}