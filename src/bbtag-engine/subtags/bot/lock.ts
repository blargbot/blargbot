import type { TagVariableScope } from '@blargbot/domain';

import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.lock;

export interface AsyncLock {
    enterWrite(): Promise<AsyncDisposable>;
    enterRead(): Promise<AsyncDisposable>;
}

export interface GetLockFeature {
    getLock(scope: TagVariableScope, name: string): AsyncLock;
}

type Features = VariablesFeature & GetLockFeature;
export class LockSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async lock(
        context: BBTagContext,
        mode: string,
        key: string,
        code: SubtagArgument
    ): Promise<string> {
        if (context.local.inLock)
            throw new BBTagRuntimeError('Lock cannot be nested');

        let m = mode.toLowerCase();
        m = `${m.slice(0, 1).toUpperCase()}${m.slice(1)}`;

        if (!isValidLockMode(m)) {
            throw new BBTagRuntimeError('Mode must be \'read\' or \'write\'', mode);
        }

        if (key.length === 0)
            throw new BBTagRuntimeError('Key cannot be empty');

        const provider = this.#features.variables.forContext(context).scopes.find((s) => key.startsWith(s.prefix));
        if (provider === undefined)
            throw new Error('Missing default variable scope!');

        const lock = this.#features.getLock(provider.scope, key.substring(provider.prefix.length));
        await using _handle = await lock[`enter${m}`]();
        try {
            context.local.inLock = true;
            return await code.wait();
        } finally {
            context.local.inLock = false;
        }
    }
}

function isValidLockMode(mode: string): mode is 'Read' | 'Write' {
    return ['Read', 'Write'].includes(mode);
}
