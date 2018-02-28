/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:43
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:19:43
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('usercreatedat')
    .withArgs(a => [a.optional('format'), a.optional('user'), a.optional('quiet')])
    .withDesc('Returns the date the user was created, in UTC+0. ' +
      'If a `format` code is specified, the date is formatted accordingly.' +
      'Leave blank for default formatting. ' +
      'See the <a href=\'http://momentjs.com/docs/#/displaying/format/\'>moment documentation</a> for more information. ' +
      'If `user` is specified, gets that user instead. If `quiet` isspecified,' +
      'if a user can\'t be found it will simply return the `user`')
    .withExample(
      'Your account was created on {usercreatedat;YYYY/MM/DD HH:mm:ss}',
      'Your account was created on 2016/01/01 01:00:00.'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-4', async function (params) {
      let user = await bu.getUser(params.msg, params.args[2], params.args[3]);

      if (user != null)
        return dep.moment(user.createdAt).format(params.args[1] || '');

      if (params.args[3])
        return params.args[2];
      return '';
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();