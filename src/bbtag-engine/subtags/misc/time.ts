import moment from 'moment-timezone';

import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToTimestamp } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.time;

export class TimeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'time',
            category: SubtagType.MISC,
            description: tag.description,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'time?:now', 'parseFormat?', 'fromTimezone?:Etc/UTC', 'toTimezone?:Etc/UTC'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [format, time, parseFormat, fromTimezone, toTimezone]) => this.changeTimezone(time.value, parseFormat.value, fromTimezone.value, format.value, toTimezone.value)
                }
            ]
        });
    }

    public changeTimezone(timestampStr: string, inputFormat: string, inputTimezone: string, outputFormat: string, outputTimezone: string): string {
        const timestamp = convertToTimestamp(timestampStr, inputFormat, inputTimezone)
            ?? new BBTagRuntimeError('Invalid date').throw();
        const result = timestamp.withTimeZone(outputTimezone);
        return moment.tz(result.epochMilliseconds, result.timeZoneId)
            .format(outputFormat);
    }
}
