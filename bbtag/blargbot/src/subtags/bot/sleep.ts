import { sleep } from '@blargbot/async-tools';
import moment from 'moment-timezone';

import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { resolveDuration, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.sleep;

const maxSleep = moment.duration(5, 'minutes');

@Subtag.names('sleep')
@Subtag.ctorArgs('converter')
export class SleepSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['duration'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (_, [duration]) => this.sleep(duration.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public async sleep(duration: string): Promise<void> {
        let delay = resolveDuration(this.#converter.duration(duration))?.asMilliseconds();
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        const max = resolveDuration(maxSleep).asMilliseconds();
        if (delay > max)
            delay = max;

        await sleep(delay);
    }
}
