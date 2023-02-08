import { isClass } from '@blargbot/guards';

import { BaseModuleLoader } from './BaseModuleLoader.js';
import type { Logger } from './Logger.js';
import type { ModuleResult } from './ModuleResult.js';

export class ModuleLoader<TModule> extends BaseModuleLoader<TModule> {
    readonly #getNames: (module: TModule, fileName: string) => Iterable<string>;

    public constructor(
        public readonly context: ImportMeta,
        public readonly path: string,
        public readonly type: ClassOf<TModule>,
        public readonly constructorArguments: unknown[],
        public readonly logger: Logger,
        getNames?: (module: TModule) => Iterable<string>
    ) {
        super(context, path, logger);
        this.#getNames = getNames === undefined
            ? (_, fileName) => [fileName]
            : module => {
                let names = getNames(module);
                if (typeof names === 'string')
                    names = [names];
                return names;
            };
    }

    protected tryActivate(rawModule: unknown, fileName: string): ModuleResult<TModule> | undefined {
        if (rawModule instanceof this.type)
            return { module: rawModule, names: this.#getNames(rawModule, fileName) };

        if (isClass(rawModule, this.type)) {
            const instance = new rawModule(...this.constructorArguments);
            return { module: instance, names: this.#getNames(instance, fileName) };
        }

        return undefined;
    }
}
