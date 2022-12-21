import Brainfuck from 'brainfuck-node';

import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class BrainfuckSubtag extends Subtag {
    readonly #bfClient: Brainfuck;
    public constructor() {
        super({
            name: 'brainfuck',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['code', 'input?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [code, input]) => this.runBrainfuck(code.value, input.value)
                }
            ]
        });
        this.#bfClient = new Brainfuck();
    }

    public runBrainfuck(code: string, input: string): string {
        try {
            return this.#bfClient.execute(code, input).output;
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw new BBTagRuntimeError('Unexpected error from brainfuck');
        }
    }
}
