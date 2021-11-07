import { BaseSubtag, BBTagContext, tagVariableScopes } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import ReadWriteLock from 'rwlock';

export class LockSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'lock',
            category: SubtagType.BOT,
            desc: 'Provides read/write locking functionality for bbtag. This is a very advanced feature, ' +
                'so it is reccomended that you first [read about the concept of locks](https://en.wikipedia.org/wiki/Lock_\\(computer_science\\)).' +
                '\n\nIn simple terms, a lock allows commands running at the same time to cooperate and wait for eachother to finish ' +
                'what they are doing before "releasing the lock" and letting other commands use that lock. ' +
                'This can be used to secure against data being edited by 2 things at the same time, which can cause inconsistencies.' +
                '\n\nThere can be multiple `read` locks held at once or a single `write` lock. This means that if all your command is doing ' +
                'is reading some data then as long as nothing is writing to it, it will be allowed, otherwise the command will wait until ' +
                'it can aquire a lock.' +
                '\n\n`mode` must be either `read` or `write`.' +
                '\n`key` can be anything. This follows the same scoping rules as variables do.' +
                '\n`code` will be run once the lock is acquired',
            definition: [
                {
                    parameters: ['mode', 'key', '~code'],
                    exampleCode:
                        '\n{//;in 2 command run in quick succession}' +
                        '\n{lock;write;key;' +
                        '\n  {void;' +
                        '\n    {send;{channelid};Start}' +
                        '\n    {send;{channelid};Middle}' +
                        '\n    {send;{channelid};End}' +
                        '\n  }' +
                        '\n}' +
                        '\nThis order is guaranteed always. Without a lock it isnt',
                    exampleOut:
                        '\nStart' +
                        '\nMiddle' +
                        '\nEnd' +
                        '\nStart' +
                        '\nMiddle' +
                        '\nEnd' +
                        '\nThis order is guaranteed always. Without a lock it isnt',
                    execute: async (ctx, [{ value: mode }, { value: key }, code], subtag) => await this.lock(ctx, mode, key, code, subtag)
                }
            ]
        });
    }

    public async lock(
        context: BBTagContext,
        mode: string,
        key: string,
        code: SubtagArgumentValue,
        subtag: SubtagCall
    ): Promise<string> {
        if (context.scopes.local.inLock)
            return this.customError('Lock cannot be nested', context, subtag);

        mode = mode.toLowerCase();

        if (!isValidLockMode(mode)) {
            return this.customError(
                'Mode must be \'read\' or \'write\'',
                context,
                subtag
            );
        }

        if (key.length === 0)
            return this.customError('Key cannot be empty', context, subtag);

        const lockScope = tagVariableScopes.find((s) => key.startsWith(s.prefix));
        if (lockScope === undefined)
            throw new Error('Missing default variable scope!');

        const lock = lockScope.getLock(
            context,
            key.substring(lockScope.prefix.length)
        );

        const release = await lockAsync(lock, `${mode}Lock`);
        try {
            context.scopes.local.inLock = true;
            return await code.wait();
        } finally {
            context.scopes.local.inLock = false;
            release();
        }
    }
}

function lockAsync(lock: ReadWriteLock, mode: 'readLock' | 'writeLock'): Promise<() => void> {
    return new Promise(resolve => lock[mode](release => resolve(release)));
}

function isValidLockMode(mode: string): mode is 'read' | 'write' {
    return ['read', 'write'].includes(mode);
}
