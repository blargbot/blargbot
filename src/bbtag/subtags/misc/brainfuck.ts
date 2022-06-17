import { default as Brainfuck } from 'brainfuck-node';

import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class BrainfuckSubtag extends CompiledSubtag {
    private readonly bfClient: Brainfuck;
    public constructor() {
        super({
            name: 'brainfuck',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['code', 'input?'],
                    description: 'Interprets `code` as brainfuck, using `input` as the text for `,`.',
                    exampleCode: '{brainfuck;-[------->+<]>-.-[->+++++<]>++.+++++++..+++.[--->+<]>-----.---[->+++<]>.-[--->+<]>---.+++.------.--------.-[--->+<]>.}',
                    exampleOut: 'Hello World!',
                    returns: 'string',
                    execute: (_, [code, input]) => this.runBrainfuck(code.value, input.value)
                }
            ]
        });
        this.bfClient = new Brainfuck();
    }

    public runBrainfuck(code: string, input: string): string {
        try {
            return this.bfClient.execute(code, input).output;
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw new BBTagRuntimeError('Unexpected error from brainfuck');
        }
    }
}
