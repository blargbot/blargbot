import { guard } from '../../../core';
import { BaseImageGenerator } from './BaseImageGenerator';
import { BaseModuleLoader, ModuleResult } from './globalCore';

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

        if (guard.isClass(rawModule, BaseImageGenerator)) {
            const instance = new rawModule(this.logger);
            return { module: instance, names: getNiceNames(instance.constructor) };
        }

        return null;
    }
}

// eslint-disable-next-line @typescript-eslint/ban-types
function getNiceNames(type: Function): string[] {
    let name = type.name.toLowerCase();
    if (name.endsWith('generator'))
        name = name.substring(0, name.length - 'generator'.length);
    return [name];
}
