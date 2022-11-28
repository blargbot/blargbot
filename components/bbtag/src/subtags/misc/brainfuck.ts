import { default as Brainfuck } from 'brainfuck-node';

import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.brainfuck;

export class BrainfuckSubtag extends CompiledSubtag {
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
