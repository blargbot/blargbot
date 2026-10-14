import { humanize, parse } from '@blargbot/core';
import type { FlagDefinition } from '@blargbot/domain';

import type { BBTagInput } from './types.js';

export function toBBTagInput(input: string, flags: ReadonlyArray<FlagDefinition<string>>): BBTagInput {
    return {
        raw: input,
        array: humanize.smartSplit(input),
        flags: parse.flags(flags, input)
    };
}
