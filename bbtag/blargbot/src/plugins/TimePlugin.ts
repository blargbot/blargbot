import type { BBTagProcess } from '@bbtag/engine';
import { BBTagPlugin, BBTagRuntimeError } from '@bbtag/engine';

export abstract class TimePlugin extends BBTagPlugin {
    public abstract parseTime(timestamp: string, format?: string, timezone?: string): Timestamp;
}

export class DefaultTimePlugin extends TimePlugin {
    public static type = TimePlugin;
    public static createPlugin(process: BBTagProcess): DefaultTimePlugin {
        return new DefaultTimePlugin(process);
    }

    public override parseTime(timestamp: string, format?: string, timezone?: string): Timestamp {
        // TODO: Proper implementation
        timestamp;
        format;
        timezone;
        throw new BBTagRuntimeError('Invalid date');
    }
}

export interface Timestamp {
    toTimezone(timezone: string): Timestamp;
    format(format: string): string;
}
