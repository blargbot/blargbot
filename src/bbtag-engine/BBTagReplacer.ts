import type { BBTagAnyLocal } from './BBTagAnyLocal.js';
import type { BBTagContext } from './BBTagContext.js';
import type { BBTagReplaceResult } from './BBTagReplaceResult.js';
import type { BBTagSubtag } from './language/BBTagSubtag.js';

export type BBTagReplacer<
    in Locals extends Record<string, unknown> = BBTagAnyLocal
> = (context: BBTagContext<Locals>, name: string, bbtag: BBTagSubtag) => BBTagReplaceResult;
