import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.repeat;

@Subtag.names('repeat', 'loop')
@Subtag.ctorArgs('converter')
export class RepeatSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['~code', 'amount'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'loop',
                    execute: (ctx, [code, amount]) => this.repeat(ctx, amount.value, code)
                }
            ]
        });

        this.#converter = converter;
    }
    public async* repeat(
        context: BBTagContext,
        amountStr: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const amount = this.#converter.int(amountStr) ?? this.#converter.int(context.scopes.local.fallback ?? '');
        if (amount === undefined)
            throw new NotANumberError(amountStr);
        if (amount < 0)
            throw new BBTagRuntimeError('Can\'t be negative');

        for (let i = 0; i < amount; i++) {
            await context.limit.check(context, 'repeat:loops');
            yield await code.execute();
            if (context.data.state !== BBTagRuntimeState.RUNNING)
                break;
        }
    }
}
