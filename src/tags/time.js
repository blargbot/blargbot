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
            a.optional('timezone')
        ])
        .withDesc('Returns the current time, in UTC+0. If a `format` code is specified, ' +
            'the date is formatted accordingly. Leave blank for default formatting. ' +
            'See the <a href=\'http://momentjs.com/docs/#/displaying/format/\'>moment documentation</a> ' +
            'for more information.\nAdditionally, you can specify another ' +
            'time to display, and a format to parse it with. ' +
            'See <a href=\'http://momentjs.com/docs/#/parsing/\'>here</a> for parsing documentation. ' +
            'See <a href=\'https://en.wikipedia.org/wiki/List_of_tz_database_time_zones\'>here</a> for a list of timezone codes.')
        .withExample(
            'It\'s currently {time;YYYY/MM/DD HH:mm:ss}',
            'It\'s currently 2016/01/01 01:00:00'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-5', async function (params) {
            let format = params.args[1],
                time = params.args[2],
                parse = params.args[3],
                timezone = params.args[4],
                date = dep.moment.tz(time, parse, timezone || 'Etc/UTC');

            if (!date.isValid()) return await Builder.util.error(params, 'Invalid date');

            return date.format(format || '');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();