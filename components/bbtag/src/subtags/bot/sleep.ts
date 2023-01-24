import { sleep } from '@blargbot/async-tools';
import moment from 'moment-timezone';

import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.sleep;

const maxSleep = moment.duration(5, 'minutes');

@Subtag.id('sleep')
@Subtag.factory(Subtag.converter())
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
        let delay = this.#converter.duration(duration);
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        if (delay.asMilliseconds() > maxSleep.asMilliseconds())
            delay = maxSleep;

        await sleep(delay.asMilliseconds());
    }
}
