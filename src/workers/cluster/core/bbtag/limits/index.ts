import * as rules from './rules';
import { CustomCommandLimit } from './CustomCommandLimit';
import { EverythingAutoResponseLimit } from './EverythingAutoResponseLimit';
import { GeneralAutoResponseLimit } from './GeneralAutoResponseLimit';
import { TagLimit } from './TagLimit';

export { rules };

export const limits = {
    CustomCommandLimit,
    EverythingAutoResponseLimit,
    GeneralAutoResponseLimit,
    TagLimit
};