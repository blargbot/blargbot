import { Logger } from '@core/Logger';
import { BaseModuleLoader } from '@core/modules';
import { ModuleResult } from '@core/types';
import { guard } from '@core/utils';

import { BaseImageGenerator } from './BaseImageGenerator';

export class ImageModuleLoader extends BaseModuleLoader<BaseImageGenerator> {
    public constructor(
        public readonly source: string,
        logger: Logger
    ) {
        super(source, logger);
    }

    protected tryActivate(rawModule: unknown): ModuleResult<BaseImageGenerator> | undefined {
        if (rawModule instanceof BaseImageGenerator) {
            return { module: <BaseImageGenerator>rawModule, names: [rawModule.key] };
        }

        if (guard.isClass(rawModule, BaseImageGenerator)) {
            const instance = new rawModule(this.logger);
            return { module: <BaseImageGenerator>instance, names: [instance.key] };
        }

        return undefined;
    }
}
