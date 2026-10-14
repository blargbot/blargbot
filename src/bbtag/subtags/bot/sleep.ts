import { parse } from '@blargbot/core';
import type { sleep as $sleep } from '@blargbot/util';
import moment from 'moment-timezone';

import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.sleep;

const maxSleep = moment.duration(5, 'minutes');

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
        let delay = parse.duration(duration);
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        if (delay.asMilliseconds() > maxSleep.asMilliseconds())
            delay = maxSleep;

        await this.#sleep(delay.asMilliseconds());
    }
}
