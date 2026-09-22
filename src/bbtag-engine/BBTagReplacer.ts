import type { BBTagContext } from './BBTagContext.js';
import type { BBTagReplaceResult } from './BBTagReplaceResult.js';
import type { BBTagSubtag } from './language/BBTagSubtag.js';

export interface BBTagReplacer<in Locals extends object = object> {
    replace: (context: BBTagContext<Locals>, name: string, bbtag: BBTagSubtag) => BBTagReplaceResult;
    readonly name: string | null;
    readonly aliases: ReadonlySet<string>;
}
