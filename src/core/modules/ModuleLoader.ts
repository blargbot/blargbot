import { Logger } from '@core/Logger';
import { ModuleResult } from '@core/types';
import { guard } from '@core/utils';

import { BaseModuleLoader } from './BaseModuleLoader';

export class ModuleLoader<TModule> extends BaseModuleLoader<TModule> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #getNames: (module: TModule) => Iterable<string>;

    public constructor(
        public readonly root: string,
        public readonly type: ClassOf<TModule>,
        public readonly constructorArguments: unknown[],
        public readonly logger: Logger,
        getNames: (module: TModule) => Iterable<string>
    ) {
        super(root, logger);
        this.#getNames = module => {
            let names = getNames(module);
            if (typeof names === 'string')
                names = [names];
            return names;
        };
    }

    protected tryActivate(rawModule: unknown): ModuleResult<TModule> | undefined {
        if (rawModule instanceof this.type)
            return { module: <TModule>rawModule, names: this.#getNames(<TModule>rawModule) };

        if (guard.isClass(rawModule, this.type)) {
            const instance = new rawModule(...this.constructorArguments);
            return { module: instance, names: this.#getNames(instance) };
        }

        return undefined;
    }
}