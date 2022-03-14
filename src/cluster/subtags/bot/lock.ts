import { BBTagContext, DefinedSubtag, tagVariableScopes } from '@blargbot/cluster/bbtag';
import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { SubtagArgument } from '@blargbot/cluster/types';
import { SubtagType } from '@blargbot/cluster/utils';
import ReadWriteLock from 'rwlock';

export class LockSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: async (ctx, [mode, key, code]) => await this.lock(ctx, mode.value, key.value, code)
                }
            ]
        });
    }

    public async lock(
        context: BBTagContext,
        mode: string,
        key: string,
        code: SubtagArgument
    ): Promise<string> {
        if (context.scopes.local.inLock)
            throw new BBTagRuntimeError('Lock cannot be nested');

        mode = mode.toLowerCase();

        if (!isValidLockMode(mode)) {
            throw new BBTagRuntimeError('Mode must be \'read\' or \'write\'', mode);
        }

        if (key.length === 0)
            throw new BBTagRuntimeError('Key cannot be empty');

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
