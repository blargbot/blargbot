import ReadWriteLock from 'rwlock';

import { SubtagArgument } from '../../arguments';
import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { getLock } from '../../getLock';
import { tagVariableScopeProviders } from '../../tagVariableScopeProviders';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.lock;

export class LockSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'lock',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['mode', 'key', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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

        const provider = tagVariableScopeProviders.find((s) => key.startsWith(s.prefix));
        if (provider === undefined)
            throw new Error('Missing default variable scope!');

        const scope = provider.getScope(context);
        const lock = getLock(scope, key.substring(provider.prefix.length));
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
