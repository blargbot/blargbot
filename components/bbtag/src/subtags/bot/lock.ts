import type ReadWriteLock from 'rwlock';

import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { getLock } from '../../getLock.js';
import { Subtag } from '../../Subtag.js';
import { tagVariableScopeProviders } from '../../tagVariableScopeProviders.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.lock;

@Subtag.id('lock')
@Subtag.ctorArgs()
export class LockSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
