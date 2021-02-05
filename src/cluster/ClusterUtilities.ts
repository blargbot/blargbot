import { BaseUtilities } from '../core/BaseUtilities';
import request from 'request';
import { Cluster } from './Cluster';

export class ClusterUtilities extends BaseUtilities {
    constructor(public readonly cluster: Cluster) {
        super(cluster);
    }

    postStats() {
        // updateStats();
        var stats = {
            server_count: this.guilds.size,
            shard_count: this.shards.size,
            shard_id: this.cluster.id
        };
        // bot.executeWebhook('511922345099919360', config.shards.shardToken, {
        //     content: JSON.stringify(stats)
        // });
        this.logger.log(stats);
        request.post({
            'url': `https://discord.bots.gg/api/v1/bots/${this.user.id}/stats`,
            'headers': {
                'content-type': 'application/json',
                'Authorization': this.config.general.botlisttoken,
                'User-Agent': 'blargbot/1.0 (ratismal)'
            },
            'json': true,
            body: stats
        }, (err) => {
            if (err)
                this.logger.error(err);
        });

        if (!this.config.general.isbeta) {
            this.logger.info('Posting to matt');

            request.post({
                'url': 'https://www.carbonitex.net/discord/data/botdata.php',
                'headers': {
                    'content-type': 'application/json'
                },
                'json': true,
                body: {
                    'key': this.config.general.carbontoken,
                    'servercount': stats.server_count,
                    shard_count: stats.shard_count,
                    shard_id: stats.shard_id,
                    'logoid': this.user.avatar
                }
            }, (err) => {
                if (err)
                    this.logger.error(err);
            });

            let shards = [];
            for (const shardId of this.shards.map(s => s.id)) {
                shards[shardId] = this.guilds.filter(g => g.shard.id === shardId);
            }
            request.post({
                url: `https://discordbots.org/api/bots/${this.user.id}/stats`,
                json: true,
                headers: {
                    'content-type': 'application/json',
                    'Authorization': this.config.general.botlistorgtoken,
                    'User-Agent': 'blargbot/1.0 (ratismal)'
                },
                body: {
                    shards
                }
            }, err => {
                if (err)
                    this.logger.error(err);
            });
        }
    };
}