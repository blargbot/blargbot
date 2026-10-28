import { memoize, Timer } from '@blargbot/util';

import type { BBTagEngine } from './BBTagEngine.js';
import type { BBTagRuntimeError } from './errors/index.js';
import { SubtagStackOverflowError, UnknownSubtagError } from './errors/index.js';
import type { BBTagExpression, SubtagCall } from './language/index.js';
import type { Subtag } from './Subtag.js';
import { SubtagCallStack } from './SubtagCallStack.js';
import type { BBTagRuntimeRootScope, BBTagRuntimeScope, LocatedRuntimeError, RuntimeDebugEntry } from './types.js';
import { BBTagRuntimeState } from './types.js';

export class BBTagContext {
    readonly #scopes: BBTagRuntimeScope[] = [];
    #local: BBTagRuntimeScope;

    public readonly execTimer = new Timer();
    public readonly dbTimer = new Timer();
    public readonly errors: LocatedRuntimeError[] = [];
    public readonly debug: RuntimeDebugEntry[] = [];
    public readonly callStack = new SubtagCallStack();
    public readonly subtagInvocations = new Map<string, number[]>();
    public readonly root: BBTagRuntimeRootScope;

    public dbObjectsCommitted = 0;
    public state: BBTagRuntimeState = BBTagRuntimeState.RUNNING;
    public subtagCount = 0;

    public get local(): BBTagRuntimeScope {
        return this.#local;
    }

    public constructor(
        public readonly engine: BBTagEngine,
        root: BBTagRuntimeRootScope
    ) {
        this.root = root;
        this.#local = root;
    }

    public enterRecursion(): Disposable {
        if (this.root.recursion.depth >= 200) {
            this.state = BBTagRuntimeState.ABORT;
            throw new SubtagStackOverflowError(this.root.recursion.depth);
        }

        this.root.recursion.depth++;
        return {
            [Symbol.dispose]: memoize(() => this.root.recursion.depth--)
        };
    }

    public enterScope(): Disposable & BBTagRuntimeScope {
        const scope = Object.create(this.#local, {
            [Symbol.dispose]: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: memoize(() => {
                    if (this.#scopes.length === 0)
                        throw new Error('Cannot pop the root scope');
                    this.#scopes.pop();
                    this.#local = this.#scopes.at(-1) ?? this.root;
                })
            }
        });
        this.#scopes.push(scope);
        this.#local = scope;
        return scope;
    }

    public eval(bbtag: SubtagCall | BBTagExpression): Promise<string> {
        return this.engine.eval(bbtag, this);
    }

    public getSubtag(name: string): Subtag {
        return this.engine.getSubtag(name)
            ?? new UnknownSubtagError(name).throw();
    }

    public addError(error: BBTagRuntimeError, subtag?: SubtagCall): string {
        this.errors.push({ subtag: subtag, error });
        return error.display ?? this.local.fallback ?? `\`${error.message}\``;
    }
}
