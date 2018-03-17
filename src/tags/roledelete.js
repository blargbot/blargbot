/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-11-01 09:52:35
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('roledelete')
        .requireStaff()
        .withArgs(a => [a.require('role'), a.optional('quiet')])
        .withDesc('Deletes `role`. If `quiet` is specified, if `role` can\'t be found it will return nothing')
        .withExample(
            '{roledelete;Super Cool Role!}',
            '(rip no more super cool roles for anyone)'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let quiet = bu.isBoolean(params.quiet) ? params.quiet : !!params.args[2],
                role = await bu.getRole(params.msg, params.args[1], quiet);
            if (role) {
                try {
                    await role.delete(`Deleted with the '${params.tagName}' command, executed by ${params.msg.author.username}#${params.msg.author.discrim} (${params.msg.author.id})`);
                } catch (err) {
                    console.error(err.stack);
                    return await Builder.util.error(params, 'Failed to delete role: no perms');
                }
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();