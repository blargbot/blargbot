import { BaseModuleLoader, ModuleResult } from "./BaseModuleLoader";
import { Cluster } from "../cluster";

export class ClusterModuleLoader<TModule> extends BaseModuleLoader<TModule> {
    readonly #getNames: (module: any) => Iterable<string>;

    constructor(
        public readonly cluster: Cluster,
        public readonly source: string,
        public readonly type: ClassOf<TModule>,
        getNames: (module: TModule) => Iterable<string>
    ) {
        super(source);
        this.#getNames = module => {
            let names = getNames(module);
            if (typeof names === 'string')
                names = [names];
            return names;
        };
    }

    protected logFailure(err: any, fileName: string): void {
        if (err instanceof Error)
            this.cluster.logger.error(err.stack);
        this.cluster.logger.module(this.source, 'Error while loading module', fileName);
    }

    protected activate(fileName: string, rawModule: any) {
        let result: Array<ModuleResult<TModule> | undefined> = [];
        if (typeof rawModule === 'object' || typeof rawModule === 'function') {
            result = [this.tryActivate(rawModule)];
            if (result[0] === undefined) {
                result = Object.values(rawModule)
                    .map(m => this.tryActivate(m));
            }
        }

        if (result.length === 0)
            this.cluster.logger.debug(`No modules found in ${fileName}`);

        return result
            .filter(m => m !== undefined) as Array<ModuleResult<TModule>>;
    }

    private tryActivate(rawModule: any) {
        if (rawModule instanceof this.type) {
            return { module: rawModule, names: this.#getNames(rawModule) };
        }

        if (typeof rawModule?.constructor === 'function' && rawModule.prototype instanceof this.type) {
            let instance = new rawModule(this.cluster);
            return { module: instance, names: this.#getNames(instance) };
        }
    }
}

module.exports = { ClusterModuleLoader };