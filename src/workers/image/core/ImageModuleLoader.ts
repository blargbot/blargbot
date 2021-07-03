import { BaseImageGenerator } from './BaseImageGenerator';
import { BaseModuleLoader, Logger, guard, ModuleResult } from './globalCore';

export class ImageModuleLoader extends BaseModuleLoader<BaseImageGenerator> {
    public constructor(
        public readonly source: string,
        logger: Logger
    ) {
        super(source, logger);
    }

    protected tryActivate(rawModule: unknown): ModuleResult<BaseImageGenerator> | null {
        if (rawModule instanceof BaseImageGenerator) {
            return { module: <BaseImageGenerator>rawModule, names: [rawModule.key] };
        }

        if (guard.isClass(rawModule, BaseImageGenerator)) {
            const instance = new rawModule(this.logger);
            return { module: <BaseImageGenerator>instance, names: [instance.key] };
        }

        return null;
    }
}