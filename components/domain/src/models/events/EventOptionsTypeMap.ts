import type { PollEventOptions } from './PollEventOptions.js';
import type { RemindEventOptions } from './RemindEventOptions.js';
import type { TagEventOptions } from './TagEventOptions.js';
import type { TimerEventOptions } from './TimerEventOptions.js';
import type { UnbanEventOptions } from './UnbanEventOptions.js';
import type { UnmuteEventOptions } from './UnmuteEventOptions.js';

export type EventOptionsTypeMap = {
    tag: TagEventOptions;
    unmute: UnmuteEventOptions;
    unban: UnbanEventOptions;
    timer: TimerEventOptions;
    remind: RemindEventOptions;
    poll: PollEventOptions;
};
