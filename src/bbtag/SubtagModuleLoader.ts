import { ModuleLoader } from '@blargbot/core/modules';
import { Logger } from '@blargbot/logger';

import { Subtag } from './Subtag';

export class SubtagModuleLoader extends ModuleLoader<Subtag> {
    public constructor(logger: Logger) {
        super(`${__dirname}/subtags`, Subtag, [], logger, t => [t.name, ...t.aliases]);
    }
}
