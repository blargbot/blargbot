/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2019-01-08 09:09:44
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.AutoTag('unindent')
    .withArgs(a => [a.require('text'), a.optional('level')])
    .withAlias('ui')
    .withDesc('Unindents text (or code!). If no level is provided, attempts to guess the indentation level.')
    .withExample(
    '{unindent;\n  hello\n  world}',
    'hello\nworld'
    )
    .whenArgs(0, Builder.errors.notEnoughArguments)
    .whenArgs('1-2', async function (subtag, context, args) {
      let level = parseInt(args[1]);
      if (isNaN(level)) {
        level = null;
        let lines = args[0].split('\n').slice(1);
        for (const line of lines) {
          let l = 0;
          for (const letter of line) {
            if (letter === ' ') l++;
            else break;
          }
          if (!level || l < level)
            level = l;
        }
      }
      if (level) {
        let regexp = new RegExp(`^ {1,${level}}`, 'gm');
        let unindented = args[0].replace(regexp, '');
        return unindented;
      } else return args[0];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();