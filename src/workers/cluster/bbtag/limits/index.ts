import { CustomCommandLimit } from './CustomCommandLimit';
import { EverythingAutoResponseLimit } from './EverythingAutoResponseLimit';
import { GeneralAutoResponseLimit } from './GeneralAutoResponseLimit';
import * as rules from './rules';
import { TagLimit } from './TagLimit';

export * from './CustomCommandLimit';
export * from './EverythingAutoResponseLimit';
export * from './GeneralAutoResponseLimit';
export * from './TagLimit';
export { rules };

export const limits = {
    customCommandLimit: CustomCommandLimit,
    everythingAutoResponseLimit: EverythingAutoResponseLimit,
    generalAutoResponseLimit: GeneralAutoResponseLimit,
    tagLimit: TagLimit
};
