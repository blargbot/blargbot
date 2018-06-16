/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    engine = require('../structures/bbtag/Engine');

module.exports =
    Builder.AutoTag('lock')
        .withArgs(a => [a.require('mode'), a.require('key'), a.require('code')])
        .withDesc('WIP')
        .withExample(
            '',
            ''
        )
        .resolveArgs(0, 1)
        .whenArgs('0-2', Builder.errors.notEnoughArguments)
        .whenArgs(3, async function (subtag, context, args) {
            let [mode, key, code] = args;
            mode = mode.toLowerCase();

            console.debug(args);

            if (!['read', 'write'].includes(mode))
                return Builder.util.error(subtag, context, 'Mode must be \'read\' or \'write\'');

            if (!key)
                return Builder.util.error(subtag, context, 'Key cannot be empty');

            let scope = bu.tagVariableScopes.find(s => key.startsWith(s.prefix));
            if (scope == null) throw new Error('Missing default variable scope!');

            let lock = scope.getLock(key.substring(scope.prefix.length));
            let lockFunc = lock[mode + 'Lock'];

            let lockOverride = context.override('lock', (subtag, context) => Builder.util.error(subtag, context, 'Lock cannot be nested'));

            try {
                return await new Promise(async function (resolve, reject) {
                    lockFunc(async function (release) {
                        try {
                            resolve(await engine.execute(code, context));
                        } catch (err) {
                            reject(err);
                        } finally {
                            release();
                        }
                    });
                });
            } finally {
                lockOverride.revert();
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();