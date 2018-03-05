/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-11-01 09:52:12
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('rolecreate')
    .requireStaff()
    .withArgs(a => [
      a.require('name'),
      a.optional('color'),
      a.optional('permissions'),
      a.optional('mentionable'),
      a.optional('hoisted')
    ])
    .withDesc('Creates a role with the given information. ' +
      'Provide color in hex. ' +
      'Provide permissions as a number, which can be calculated [here](https://discordapi.com/permissions.html) ' +
      'Color defaults to #000000 (uncolored role), permissions defaults to 0, mentionable defaults to false, hoisted defaults to false. ' +
      'Returns the new role\'s ID.')
    .withExample(
      '{rolecreate;Super Cool Role!;ff0000;0;false;true}',
      '11111111111111111'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-6', async function (params) {
      let errors = [],
        options = {
          name: params.args[1],
          color: bu.parseColor(params.args[2]) || 0,
          permissions: parseInt(params.args[3]),
          mentionable: (params.args[4] || 'false').toLowerCase() === 'true',
          hoisted: (params.args[5] || 'false').toLowerCase() === 'true'
        };

      console.debug('role options: ', options);

      if (isNaN(options.permissions)) 
        return await Builder.util.error('Permissions not a number');

      try {
        let role = await params.msg.guild.createRole(options, `Created with a custom command command, executed by user: ${params.msg.author.id}`);
        return role.id;
      } catch (err) {
        console.error(err.stack);
        return await Builder.util.error(params, 'Failed to create role: no perms');
      }
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();