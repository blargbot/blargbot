import { BaseModuleLoader, ModuleResult } from './BaseModuleLoader';
import { Cluster } from '../cluster';

export class ClusterModuleLoader<TModule> extends BaseModuleLoader<TModule> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #getNames: (module: TModule) => Iterable<string>;

    public constructor(
        public readonly source: string,
        public readonly cluster: Cluster,
        public readonly type: ClassOf<TModule>,
        getNames: (module: TModule) => Iterable<string>
    ) {
        super(source, cluster.logger);
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

        if (isConstructor(rawModule, this.type)) {
            const instance = new rawModule(this.cluster);
            return { module: instance, names: this.#getNames(instance) };
        }

        return null;
    }
}

function isConstructor<TModule>(value: unknown, type: ClassOf<TModule>): value is new (cluster: Cluster) => TModule {
    return typeof value === 'function' && value.prototype instanceof type;
}