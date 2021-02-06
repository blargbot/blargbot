import { BaseModuleLoader } from "./BaseModuleLoader";
import { Cluster } from "../cluster";

export class ClusterModuleLoader<TModule> extends BaseModuleLoader<TModule> {
    readonly #getNames: (module: any) => Iterable<string>;

    constructor(
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

    protected tryActivate(rawModule: any) {
        if (rawModule instanceof this.type) {
            return { module: rawModule, names: this.#getNames(rawModule) };
        }

        if (typeof rawModule?.constructor === 'function' && rawModule.prototype instanceof this.type) {
            let instance = new rawModule(this.cluster);
            return { module: instance, names: this.#getNames(instance) };
        }

        return null;
    }
}

module.exports = { ClusterModuleLoader };