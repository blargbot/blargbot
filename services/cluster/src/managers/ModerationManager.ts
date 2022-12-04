import type { Cluster } from '@blargbot/cluster';

import { BanManager, CensorManager, ChatLogManager, EventLogManager, ModLogManager, MuteManager, TimeoutManager, WarnManager } from './moderation/index.js';

export class ModerationManager {
    public readonly modLog: ModLogManager;
    public readonly bans: BanManager;
    public readonly mutes: MuteManager;
    public readonly warns: WarnManager;
    public readonly timeouts: TimeoutManager;
    public readonly censors: CensorManager;
    public readonly eventLog: EventLogManager;
    public readonly chatLog: ChatLogManager;

    public constructor(public readonly cluster: Cluster) {
        this.modLog = new ModLogManager(this.cluster);
        this.eventLog = new EventLogManager(this.cluster);
        this.chatLog = new ChatLogManager(this.cluster);
        this.bans = new BanManager(this);
        this.mutes = new MuteManager(this);
        this.warns = new WarnManager(this);
        this.timeouts = new TimeoutManager(this);
        this.censors = new CensorManager(this);
    }
}
