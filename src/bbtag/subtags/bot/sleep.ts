import { parse } from '@blargbot/core/utils/index.js';
import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.sleep;

const maxSleep = moment.duration(5, 'minutes');

export class SleepSubtag extends CompiledSubtag {
    public constructor() {
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
                    execute: (ctx, [duration]) => this.sleep(ctx, duration.value)
                }
            ]
        });
    }

    public async sleep(context: BBTagContext, duration: string): Promise<void> {
        let delay = parse.duration(duration);
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        if (delay.asMilliseconds() > maxSleep.asMilliseconds())
            delay = maxSleep;

        await context.sleep(delay.asMilliseconds());
    }
}
