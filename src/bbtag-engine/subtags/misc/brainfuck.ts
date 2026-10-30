import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.brainfuck;

export interface BrainfuckFeature {
    executeBrainfuck(code: string, input: string): Promise<string>;
}

type Features = BrainfuckFeature
export class BrainfuckSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async runBrainfuck(code: string, input: string): Promise<string> {
        try {
            return await this.#features.executeBrainfuck(code, input);
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw new BBTagRuntimeError('Unexpected error from brainfuck');
        }
    }
}
