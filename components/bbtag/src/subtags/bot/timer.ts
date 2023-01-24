import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.timer;

@Subtag.id('timer')
@Subtag.factory(Subtag.util(), Subtag.converter())
export class TimerSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['~code', 'duration'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [code, duration]) => this.queueTimer(ctx, code.raw, duration.value)
                }
            ]
        });

        this.#util = util;
        this.#converter = converter;
    }

    public async queueTimer(context: BBTagContext, code: string, durationStr: string): Promise<void> {
        const duration = this.#converter.duration(durationStr);

        if (duration === undefined || duration.asMilliseconds() <= 0)
            throw new BBTagRuntimeError('Invalid duration');
        await this.#util.setTimeout(context, code, duration);
    }
}
