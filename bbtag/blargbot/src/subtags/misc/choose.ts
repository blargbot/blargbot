import type { SubtagArgument } from '../../arguments/index.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.choose;

@Subtag.id('choose')
@Subtag.ctorArgs('converter')
export class ChooseSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['choice', '~options+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [choice, ...options]) => this.choose(choice.value, options)
                }
            ]
        });

        this.#converter = converter;
    }
    public choose(
        choice: string,
        options: SubtagArgument[]
    ): Awaitable<string> {
        const index = this.#converter.int(choice);

        if (index === undefined)
            throw new NotANumberError(choice);

        if (index < 0)
            throw new BBTagRuntimeError('Choice cannot be negative');

        if (index >= options.length)
            throw new BBTagRuntimeError('Index out of range');

        return options[index].wait();
    }
}
