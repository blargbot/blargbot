import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.time;

export class TimeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'time',
            category: SubtagType.MISC,
            description: 'If you provide `time`, you should also provide `parseFormat` to ensure it is being interpreted correctly.\nSee the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more format information.\nSee [here](http://momentjs.com/docs/#/parsing/) for parsing documentation. See [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for a list of timezone codes.',
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'time?:now', 'parseFormat?', 'fromTimezone?:Etc/UTC', 'toTimezone?:Etc/UTC'],
                    description: '`time` is in `fromTimezone` and converted to `toTimezone` using `format`.',
                    exampleCode: 'Berlin (as toTimezone): {time;HH:mm;;;;Europe/Berlin}\nBerlin from UTC 12:00: {time;HH:mm;12:00;HH:mm;;Europe/Berlin}\nBerlin (as fromTimezone): {time;HH:mm;;;Europe/Berlin}\nBerlin (as fromTimezone and empty toTimezone): {time;HH:mm;;;Europe/Berlin;}\nNew York from Berlin (12:00 in Berlin): {time;HH:mm;12:00;HH:mm;Europe/Berlin;America/New_York}',
                    exampleOut: 'Time Berlin (as toTimezone): 23:33\nBerlin from UTC 12:00: 13:00\nBerlin (as fromTimezone): 23:33\nBerlin (as fromTimezone and empty toTimezone): 21:33\nNew York from Berlin (12:00 in Berlin): 06:00',
                    returns: 'string',
                    execute: (_, [format, time, parseFormat, fromTimezone, toTimezone]) => this.changeTimezone(time.value, parseFormat.value, fromTimezone.value, format.value, toTimezone.value)
                }
            ]
        });
    }

    public changeTimezone(timestampStr: string, inputFormat: string, inputTimezone: string, outputFormat: string, outputTimezone: string): string {
        const timestamp = parse.time(timestampStr, inputFormat, inputTimezone);
        if (!timestamp.isValid())
            throw new BBTagRuntimeError('Invalid date');
        return timestamp.tz(outputTimezone).format(outputFormat);
    }
}
