import { humanize, parse } from '@blargbot/core';

import type { BBTagInput, FlagDefinition, FlagResult } from './types.js';

export function toBBTagInput(input: string, flags: readonly FlagDefinition[]): BBTagInput {
    const parsed = parse.flags(flags, input);
    return {
        raw: input,
        array: humanize.smartSplit(input),
        flags: Object.fromEntries(
            Object.entries(parsed)
                .map(([key, value]) => [key, value?.merge().value])
        ) as FlagResult
    };
}
