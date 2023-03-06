import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { DeferredExecutionService } from '../../services/DeferredExecutionService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { resolveDuration, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.timer;

@Subtag.names('timer')
@Subtag.ctorArgs('defer', 'converter')
export class TimerSubtag extends CompiledSubtag {
    readonly #defer: DeferredExecutionService;
    readonly #converter: BBTagValueConverter;

    public constructor(defer: DeferredExecutionService, converter: BBTagValueConverter) {
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

        this.#defer = defer;
        this.#converter = converter;
    }

    public async queueTimer(context: BBTagContext, code: string, durationStr: string): Promise<void> {
        const duration = resolveDuration(this.#converter.duration(durationStr))?.asMilliseconds();

        if (duration === undefined || duration <= 0)
            throw new BBTagRuntimeError('Invalid duration');
        await this.#defer.defer(context, code, duration);
    }
}
