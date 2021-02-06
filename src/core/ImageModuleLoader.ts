import { BaseModuleLoader } from "./BaseModuleLoader";
import { BaseImageGenerator } from "../structures/BaseImageGenerator";

export class ImageModuleLoader extends BaseModuleLoader<BaseImageGenerator> {
    constructor(
        public readonly source: string,
        logger: CatLogger
    ) {
        super(source, logger);
    }

    protected tryActivate(rawModule: any) {
        if (rawModule instanceof BaseImageGenerator) {
            return { module: rawModule, names: getNiceNames(rawModule.constructor) };
        }

        if (typeof rawModule.constructor === 'function' && rawModule.prototype instanceof BaseImageGenerator) {
            let instance = new rawModule(this.logger);
            return { module: instance, names: getNiceNames(instance.constructor) };
        }

        return null;
    }
}

function getNiceNames(type: Function) {
    let name = type.name.toLowerCase();
    if (name.endsWith('generator'))
        name = name.substring(0, name.length - 'generator'.length);
    return [name];
}
