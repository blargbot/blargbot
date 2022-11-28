import { PollEventOptions } from './PollEventOptions';
import { RemindEventOptions } from './RemindEventOptions';
import { TagEventOptions } from './TagEventOptions';
import { TimerEventOptions } from './TimerEventOptions';
import { UnbanEventOptions } from './UnbanEventOptions';
import { UnmuteEventOptions } from './UnmuteEventOptions';

export type EventOptionsTypeMap = {
    tag: TagEventOptions;
    unmute: UnmuteEventOptions;
    unban: UnbanEventOptions;
    timer: TimerEventOptions;
    remind: RemindEventOptions;
    poll: PollEventOptions;
};
