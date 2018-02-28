/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:42:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:42:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('guildcreatedat')
    .withArgs(a => a.optional('format'))
    .withDesc('Returns the date the current guild was created, in UTC+0. If a `format` code is specified, the date is '+
    'formatted accordingly. Leave blank for default formatting. See the <a href=\'http://momentjs.com/docs/#/displaying/format/\'>moment '+
    'documentation</a> for more information.')
    .withExample(
      'This guild was created on {guildcreatedat;YYYY/MM/DD HH:mm:ss}',
      'This guild was created on 2016/01/01 01:00:00'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-2', async function (params) {
      return dep.moment(params.msg.channel.guild.createdAt).format(params.args[1] || '');
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();