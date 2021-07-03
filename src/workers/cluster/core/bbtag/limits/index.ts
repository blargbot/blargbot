export * from './CustomCommandLimit';
export * from './EverythingAutoResponseLimit';
export * from './GeneralAutoResponseLimit';
export * from './TagLimit';

import * as rules from './rules';
import { CustomCommandLimit } from './CustomCommandLimit';
import { EverythingAutoResponseLimit } from './EverythingAutoResponseLimit';
import { GeneralAutoResponseLimit } from './GeneralAutoResponseLimit';
import { TagLimit } from './TagLimit';

export { rules };

export const limits = {
    customCommandLimit: CustomCommandLimit,
    everythingAutoResponseLimit: EverythingAutoResponseLimit,
    generalAutoResponseLimit: GeneralAutoResponseLimit,
    tagLimit: TagLimit
};