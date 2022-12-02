import { PollEventOptions } from './PollEventOptions.js';
import { RemindEventOptions } from './RemindEventOptions.js';
import { TagEventOptions } from './TagEventOptions.js';
import { TimerEventOptions } from './TimerEventOptions.js';
import { UnbanEventOptions } from './UnbanEventOptions.js';
import { UnmuteEventOptions } from './UnmuteEventOptions.js';

export type EventOptionsTypeMap = {
    tag: TagEventOptions;
    unmute: UnmuteEventOptions;
    unban: UnbanEventOptions;
    timer: TimerEventOptions;
    remind: RemindEventOptions;
    poll: PollEventOptions;
};
