import { BaseModuleLoader } from './BaseModuleLoader';
import { ModuleResult } from './types';
import { guard } from './utils';

export class ModuleLoader<TModule> extends BaseModuleLoader<TModule> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #getNames: (module: TModule) => Iterable<string>;

    public constructor(
        public readonly source: string,
        public readonly type: ClassOf<TModule>,
        public readonly constructorArguments: unknown[],
        public readonly logger: CatLogger,
        getNames: (module: TModule) => Iterable<string>
    ) {
        super(source, logger);
        this.#getNames = module => {
            let names = getNames(module);
            if (typeof names === 'string')
                names = [names];
            return names;
        };
    }

    protected tryActivate(rawModule: unknown): ModuleResult<TModule> | null {
        if (rawModule instanceof this.type) {
            return { module: <TModule>rawModule, names: this.#getNames(<TModule>rawModule) };
        }

        if (guard.isClass(rawModule, this.type)) {
            const instance = new rawModule(...this.constructorArguments);
            return { module: instance, names: this.#getNames(instance) };
        }

        return null;
    }
}