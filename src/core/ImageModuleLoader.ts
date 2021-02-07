import { BaseModuleLoader, ModuleResult } from './BaseModuleLoader';
import { BaseImageGenerator } from '../structures/BaseImageGenerator';

export class ImageModuleLoader extends BaseModuleLoader<BaseImageGenerator> {
    public constructor(
        public readonly source: string,
        logger: CatLogger
    ) {
        super(source, logger);
    }

    protected tryActivate(rawModule: unknown): ModuleResult<BaseImageGenerator> | null {
        if (rawModule instanceof BaseImageGenerator) {
            return { module: rawModule, names: getNiceNames(rawModule.constructor) };
        }

        if (isConstructor(rawModule)) {
            const instance = new rawModule(this.logger);
            return { module: instance, names: getNiceNames(instance.constructor) };
        }

        return null;
    }
}

function isConstructor(value: unknown): value is new (logger: CatLogger) => BaseImageGenerator {
    return typeof value === 'function' && value.prototype instanceof BaseImageGenerator;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function getNiceNames(type: Function): string[] {
    let name = type.name.toLowerCase();
    if (name.endsWith('generator'))
        name = name.substring(0, name.length - 'generator'.length);
    return [name];
}
