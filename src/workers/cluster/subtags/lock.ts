import { BaseSubtag, SubtagType, BBTagContext, SubtagArgumentValue, SubtagCall, tagVariableScopes } from '../core';
import ReadWriteLock from 'rwlock';

export class LockSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'lock',
            category: SubtagType.COMPLEX,
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

        const scope = tagVariableScopes.find((s) => key.startsWith(s.prefix));
        if (scope === undefined) throw new Error('Missing default variable scope!');

        const lock = scope.getLock(
            context,
            subtag,
            key.substring(scope.prefix.length)
        );

        const lockOverride = context.override('lock', {
            execute: (context, _, subtag) =>
                this.customError('Lock cannot be nested', context, subtag)
        });

        const release = await lockAsync(lock, mode === 'read' ? 'readLock' : 'writeLock');
        try {
            return await code.wait();
        } finally {
            lockOverride.revert();
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
