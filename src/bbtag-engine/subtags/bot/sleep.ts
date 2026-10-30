import type { sleep as $sleep } from '@blargbot/util';

import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToDuration } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.sleep;

const maxSleep = Temporal.Duration.from({ minutes: 5 });

export class SleepSubtag extends CompiledSubtag {
    readonly #sleep: typeof $sleep;
    public constructor({ sleep }: { sleep: typeof $sleep; }) {
        super({
            name: 'sleep',
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
        this.#sleep = sleep;
    }

    public async sleep(duration: string): Promise<void> {
        let delay = convertToDuration(duration)
            ?? new BBTagRuntimeError('Invalid duration').throw();

        if (maxSleep.subtract(delay).sign < 0)
            delay = maxSleep;

        await this.#sleep(delay.total({ unit: 'milliseconds' }));
    }
}
