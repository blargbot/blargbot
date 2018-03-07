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
    .withDesc('Returns the date that `user` was created using `format` for the output, in UTC+0. ' +
      '`user` defaults to the user executing the containing tag. `format` defaults to `YYYY-MM-DDTHH:mm:ssZ`. ' +
      'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information. ' +
      'If `quiet` is specified, if `user` can\'t be found it will simply return `user`')
    .withExample(
      'Your account was created on {usercreatedat;YYYY/MM/DD HH:mm:ss}',
      'Your account was created on 2016/01/01 01:00:00.'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1-4', async function (params) {
      let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[3],
        user = await bu.getUser(params.msg, params.args[2], quiet);

      if (user != null)
        return dep.moment(user.createdAt).format(params.args[1] || '');

      if (quiet)
        return params.args[2];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();