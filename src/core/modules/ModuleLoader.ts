import { ModuleResult } from '@blargbot/core/types';
import { guard } from '@blargbot/core/utils';
import { Logger } from '@blargbot/logger';

import { BaseModuleLoader } from './BaseModuleLoader';

export class ModuleLoader<TModule> extends BaseModuleLoader<TModule> {
    readonly #getNames: (module: TModule, fileName: string) => Iterable<string>;

    public constructor(
        public readonly root: string,
        public readonly type: ClassOf<TModule>,
        public readonly constructorArguments: unknown[],
        public readonly logger: Logger,
        getNames?: (module: TModule) => Iterable<string>
    ) {
        super(root, logger);
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

        if (guard.isClass(rawModule, this.type)) {
            const instance = new rawModule(...this.constructorArguments);
            return { module: instance, names: this.#getNames(instance, fileName) };
        }

        return undefined;
    }
}
