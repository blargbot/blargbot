import 'module-alias/register';

import { ClusterWorker } from '@cluster';
import { BBTagContext } from '@cluster/bbtag';
import { SliceSubtag } from '@cluster/subtags/array/slice';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil } from '@cluster/utils';
import { createLogger } from '@core/Logger';
import { Timer } from '@core/Timer';

let lasttime = performance.now();
export const debugStats = {
    poll(key?: string): void {
        const time = performance.now() - lasttime;
        if (key !== undefined)
            this.timings[key] = (this.timings[key] ?? 0) + time;
        lasttime = performance.now();
    },
    timings: {} as Record<string, number | undefined>
};

process.env.CLUSTER_ID = '0';
process.env.SHARDS_MAX = '1';
process.env.SHARDS_FIRST = '0';
process.env.SHARDS_LAST = '0';

void (async function test(iterCount: number) {
    const config = await import('@config');
    const logger = createLogger(config, 'test');
    const worker = new ClusterWorker(process, logger, config);
    const subtag = new SliceSubtag();
    const context = new BBTagContext(worker.cluster.bbtag, {
        author: '',
        inputRaw: '',
        isCC: false,
        limit: 'tagLimit',
        message: undefined!
    });
    const bbtag = bbtagUtil.parse('{sort;[5,4,3,7,8,2,1,9,6];true}')[0] as SubtagCall;
    const timer = new Timer().start();
    for (let i = 0; i < iterCount; i++)
        await subtag.execute(context, '//', bbtag);
    timer.end();
    logger.info(iterCount, 'iterations to', subtag.name, '- total:', timer.elapsed, 'ms - average:', timer.elapsed / iterCount, 'ms');
    logger.info(debugStats.timings);
})(1000000);
