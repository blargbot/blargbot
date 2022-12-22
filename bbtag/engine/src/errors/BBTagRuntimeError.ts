import type { BBTagSubtagCall } from '@bbtag/language';

import type { BBTagDebugMessage } from '../runtime/BBTagProcess.js';

export class BBTagRuntimeError extends Error {
    public display?: string;

    public constructor(
        message: string,
        public readonly detail?: unknown
    ) {
        super(message);
    }

    public withDisplay(error?: string): this {
        this.display = error;
        return this;
    }

    public toDebug(subtagCall: BBTagSubtagCall): BBTagDebugMessage {
        return {
            start: subtagCall.start,
            end: subtagCall.end,
            message: this.message,
            detail: this.detail
        };
    }
}
