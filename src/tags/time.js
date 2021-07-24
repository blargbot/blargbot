/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:26
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-30 00:46:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('time')
        .withArgs(a => [
            a.optional('format'),
            a.optional('time'),
            a.optional('parseformat'),
            a.optional('fromTimezone'),
            a.optional('toTimezone')
        ])
        .withDesc('Returns `time` formatted using `format`. `format` defaults to `YYYY-MM-DDTHH:mm:ssZ`. `time` defaults to the current time. ' +
            'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.\n' +
            'If you provide `time`, you should also provide `parseformat` to ensure it is being interpreted correctly. ' + 'If `fromTimezone` is provided, but `toTimezone` **and** `time` are not, then the current time in `fromTimezone` will be displayed.\n' +
            '`fromTimezone` and `toTimezone` default to `Etc/UTC` if omitted or left empty.\n' +
            'See [here](http://momentjs.com/docs/#/parsing/) for parsing documentation. ' +
            'See [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for a list of timezone codes.')
        .withExample(//Example code
            'It\'s currently {time;YYYY/MM/DD HH:mm:ss}\n```**Timezone manipulation**:\n```csharp\n' +
            'Time Berlin (as toTimezone): {time;HH:mm;;;;Europe/Berlin}\n' +
            'Time Berlin from UTC 12:00: {time;HH:mm;12:00;HH:mm;;Europe/Berlin}\n' +
            'Time Berlin (as fromTimezone): {time;HH:mm;;;Europe/Berlin}\n' +
            'Time Berlin (as fromTimezone and empty toTimezone): {time;HH:mm;;;Europe/Berlin;}\n' +
            'Time New York from Berlin (12:00 in Berlin): {time;HH:mm;12:00;HH:mm;Europe/Berlin;America/New_York}',
            //Example output
            'It\'s currently 2021/05/29 21:33:00```\n**Timezone manipulation**:\n```csharp\n' +
            'Time Berlin (as toTimezone): 23:33\n' +
            'Time Berlin from UTC 12:00: 14:00\n' +
            'Time Berlin (as fromTimezone): 23:33\n' +
            'Time Berlin (as fromTimezone and empty toTimezone): 21:33\n' +
            'Time New York from Berlin (12:00 in Berlin): 06:00'
        ).whenArgs(0, _ => bu.parseTime().format())
        .whenArgs(1, (_, __, args) => bu.parseTime().format(args[0]))
        .whenArgs('2-3', async (subtag, context, args) => {
            const date = bu.parseTime(args[1], args[2]);
            if (!date.isValid())
                return Builder.util.error(subtag, context, 'Invalid date');
            return date.format(args[0]);
        })
        .whenArgs(4, async (subtag, context, args) => {
            let date;
            if (args[1] === '') {//* This looks hideous
                date = bu.parseTime(undefined, undefined, 'Etc/UTC', args[3]);
            } else {
                date = bu.parseTime(args[1], args[2], args[3]);
            }

            if (!date.isValid())
                return Builder.util.error(subtag, context, 'Invalid date');
            return date.format(args[0]);
        })
        .whenArgs(5, async function (subtag, context, args) {
            const date = bu.parseTime(args[1], args[2], args[3], args[4] || 'Etc/UTC');
            if (!date.isValid())
                return Builder.util.error(subtag, context, 'Invalid date');
            return date.format(args[0]);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
