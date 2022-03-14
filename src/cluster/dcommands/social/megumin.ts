import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class MeguminCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('megumin', {
            search: 'megumin',
            description: 'Darkness blacker than black and darker than dark, I beseech thee, combine with my deep crimson. The time of awakening cometh. Justice, fallen upon the infallible boundary, appear now as an intangible distortion! Dance, Dance, Dance! I desire for my torrent of power a destructive force: a destructive force without equal! Return all creation to cinders, and come from the abyss!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
