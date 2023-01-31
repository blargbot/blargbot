import { CustomCommandLimit } from './CustomCommandLimit.js';
import { EverythingAutoResponseLimit } from './EverythingAutoResponseLimit.js';
import { GeneralAutoResponseLimit } from './GeneralAutoResponseLimit.js';
import { TagLimit } from './TagLimit.js';

export * from './BaseRuntimeLimit.js';
export * from './CustomCommandLimit.js';
export * from './EverythingAutoResponseLimit.js';
export * from './GeneralAutoResponseLimit.js';
export * from './TagLimit.js';
export * from './RuntimeLimit.js';
export * from './rules/index.js';

export const limits = {
    customCommandLimit: CustomCommandLimit,
    everythingAutoResponseLimit: EverythingAutoResponseLimit,
    generalAutoResponseLimit: GeneralAutoResponseLimit,
    tagLimit: TagLimit
};
