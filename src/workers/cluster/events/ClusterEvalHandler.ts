import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { EvalRequest, EvalResult } from '@core/types';
import { mapping } from '@core/utils';

export class ClusterEvalHandler extends ClusterEventService<EvalRequest, EvalResult> {
    public constructor(
        cluster: Cluster
    ) {
        super(
            cluster,
            'ceval',
            mapping.mapObject({
                userId: mapping.mapString,
                code: mapping.mapString
            }),
            async ({ data, reply }) => reply(await this.eval(data.userId, data.code))
        );
    }

    protected async eval(userId: string, code: string): Promise<EvalResult> {
        return await this.cluster.eval(userId, code);
    }
}
