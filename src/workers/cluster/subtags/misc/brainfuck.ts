import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { default as Brainfuck } from 'brainfuck-node';

const bfClient = new Brainfuck();

export class BrainFuckSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'brainfuck',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['code', 'input?'],
                    description: 'Interprets `code` as brainfuck, using `input` as the text for `,`.',
                    exampleCode: '{brainfuck;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}',
                    exampleOut: 'Hello World!',
                    execute: (_, [code, input]) => {
                        try {
                            return bfClient.execute(code.value, input.value).output;
                        } catch (e: unknown) {
                            if (e instanceof Error)
                                throw new BBTagRuntimeError(e.message);
                            throw new BBTagRuntimeError('Unexpected error from brainfuck');
                        }
                    }
                }
            ]
        });
    }
}
