import { BaseModuleLoader, ModuleResult } from "./BaseModuleLoader";
import { BaseImageGenerator } from "../structures/BaseImageGenerator";

export class ImageModuleLoader extends BaseModuleLoader<BaseImageGenerator> {
    constructor(
        public readonly logger: CatLogger,
        public readonly source: string
    ) {
        super(source);
    }

    protected logFailure(err: any, fileName: string): void {
        if (err instanceof Error)
            this.logger.error(err.stack!);
        this.logger.module(this.source, 'Error while loading module', fileName);
    }

    protected activate(fileName: string, rawModule: any) {
        let result: Array<ModuleResult<BaseImageGenerator> | undefined> = [];
        if (typeof rawModule === 'object' || typeof rawModule === 'function') {
            result = [this.tryActivate(rawModule)];
            if (result[0] === undefined) {
                result = Object.values(rawModule)
                    .map(m => this.tryActivate(m));
            }
        }

        if (result.length === 0)
            this.logger.debug(`No modules found in ${fileName}`);

        return result
            .filter(m => m !== undefined) as Array<ModuleResult<BaseImageGenerator>>;
    }

    private tryActivate(rawModule: any) {
        if (rawModule instanceof BaseImageGenerator) {
            return { module: rawModule, names: getNiceNames(rawModule.constructor) };
        }

        if (typeof rawModule.constructor === 'function' && rawModule.prototype instanceof BaseImageGenerator) {
            let instance = new rawModule(this.logger);
            return { module: instance, names: getNiceNames(instance.constructor) };
        }
    }
}

function getNiceNames(type: Function) {
    let name = type.name.toLowerCase();
    if (name.endsWith('generator'))
        name = name.substring(0, name.length - 'generator'.length);
    return [name];
}
