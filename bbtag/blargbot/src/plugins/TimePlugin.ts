import { BBTagPlugin, BBTagRuntimeError } from '@bbtag/engine';

export abstract class TimePlugin {
    public abstract parseTime(timestamp: string, format?: string, timezone?: string): Timestamp;
}

@BBTagPlugin.provides(TimePlugin)
export class DefaultTimePlugin extends TimePlugin {
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
