import { Api } from '@api';
import { BaseRoute } from '@api/BaseRoute';
import { ApiResponse } from '@api/types';
import { ClusterStats } from '@cluster/types';

export class ClustersRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/clusters');

        this.addRoute('/', {
            get: () => this.getClusters()
        });
    }

    public async getClusters(): Promise<ApiResponse> {
        const stats = await this.api.worker.request<undefined, Record<number, ClusterStats | undefined>>('getClusterStats', undefined);
        return this.ok(stats);
    }
}
