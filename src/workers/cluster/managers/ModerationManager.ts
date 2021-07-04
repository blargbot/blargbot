import { Cluster } from '../Cluster';
import { Modlog } from '../core';
import { BanManager, CensorManager, MuteManager, WarnManager } from './moderation';

export class ModerationManager {
    public readonly modlog: Modlog;
    public readonly bans: BanManager;
    public readonly mutes: MuteManager;
    public readonly warns: WarnManager;
    public readonly censors: CensorManager;

    public constructor(public readonly cluster: Cluster) {
        this.modlog = new Modlog(this.cluster);
        this.bans = new BanManager(this);
        this.mutes = new MuteManager(this);
        this.warns = new WarnManager(this);
        this.censors = new CensorManager(this);
    }

    public init(): void {
        this.bans.init();
        this.mutes.init();
    }
}
