/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-09-27 23:01:16
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
            'If you provide `time`, you should also provide `parseformat` to ensure it is being interpreted correctly. ' +
            'See [here](http://momentjs.com/docs/#/parsing/) for parsing documentation. ' +
            'See [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for a list of timezone codes.')
        .withExample(
            'It\'s currently {time;YYYY/MM/DD HH:mm:ss}',
            'It\'s currently 2016/01/01 01:00:00'
        )
        .whenArgs('0-5', async function (subtag, context, args) {
            let format = args[0],
                time = args[1],
                parse = args[2],
                fromTimezone = args[3],
                toTimezone = args[4]
                date = bu.parseTime(time, parse, fromTimezone, toTimezone);

            if (!date.isValid()) return Builder.util.error(subtag, context, 'Invalid date');

            return date.format(format || '');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
