/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:31
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-15 13:11:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('lock')
        .withArgs(a => [a.require('mode'), a.require('key'), a.require('code')])
        .withDesc('Provides read/write locking functionality for bbtag. This is a very advanced feature, ' +
        'so it is reccomended that you first [read about the concept of locks](https://en.wikipedia.org/wiki/Lock_\\(computer_science\\)).' +
        '\n\nIn simple terms, a lock allows commands running at the same time to cooperate and wait for eachother to finish ' +
        'what they are doing before "releasing the lock" and letting other commands use that lock. ' +
        'This can be used to secure against data being edited by 2 things at the same time, which can cause inconsistencies.' +
        '\n\nThere can be multiple `read` locks held at once or a single `write` lock. This means that if all your command is doing ' +
        'is reading some data then as long as nothing is writing to it, it will be allowed, otherwise the command will wait until ' +
        'it can aquire a lock.' +
        '\n\n`mode` must be either `read` or `write`.' +
        '\n`key` can be anything. This follows the same scoping rules as variables do.' +
        '\n`code` will be run once the lock is acquired')
        .withExample(
        '\n{//;in 2 command run in quick succession}' +
        '\n{lock;write;key;' +
        '\n  {void;' +
        '\n    {send;{channelid};Start}' +
        '\n    {send;{channelid};Middle}' +
        '\n    {send;{channelid};End}' +
        '\n  }' +
        '\n}' +
        '\nThis order is guaranteed always. Without a lock it isnt',

        '\nStart' +
        '\nMiddle' +
        '\nEnd' +
        '\nStart' +
        '\nMiddle' +
        '\nEnd' +
        '\nThis order is guaranteed always. Without a lock it isnt'
        )
        .resolveArgs(0, 1)
        .whenArgs('0-2', Builder.errors.notEnoughArguments)
        .whenArgs(3, async function (subtag, context, args) {
            let [mode, key, code] = args;
            mode = mode.toLowerCase();

            if (!['read', 'write'].includes(mode))
                return Builder.util.error(subtag, context, 'Mode must be \'read\' or \'write\'');

            if (!key)
                return Builder.util.error(subtag, context, 'Key cannot be empty');

            let scope = bu.tagVariableScopes.find(s => key.startsWith(s.prefix));
            if (scope == null) throw new Error('Missing default variable scope!');

            let lock = scope.getLock(context, key.substring(scope.prefix.length));
            let lockFunc = lock[mode + 'Lock'];

            let lockOverride = context.override('lock', (subtag, context) => Builder.util.error(subtag, context, 'Lock cannot be nested'));

            try {
                return await new Promise((async (resolve, reject) => {
                    lockFunc(async (release) => {
                        try {
                            resolve(await this.executeArg(subtag, code, context));
                        } catch (err) {
                            reject(err);
                        } finally {
                            release();
                        }
                    });
                }));
            } finally {
                lockOverride.revert();
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();