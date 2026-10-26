import { parse } from '@blargbot/core';
import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { SerializedBBTagContext } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.timer;

export interface ScheduleFeature {
    scheduleBBTag(context: SerializedBBTagContext, code: string, timestamp: Temporal.Instant): Promise<void>;
}

type Features = ScheduleFeature;
export class TimerSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'timer',
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
        this.#features = features;
    }

    public async queueTimer(context: BBTagContext, code: string, durationStr: string): Promise<void> {
        const duration = parse.duration(durationStr);

        if (duration === undefined || duration.asMilliseconds() <= 0)
            throw new BBTagRuntimeError('Invalid duration');

        const dueTime = Temporal.Instant.fromEpochMilliseconds(moment().add(duration).valueOf());
        await this.#features.scheduleBBTag(context.engine.serialize(context), code, dueTime);
    }
}
