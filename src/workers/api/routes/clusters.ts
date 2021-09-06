import { Api } from '@api';
import { BaseRoute } from '@api/BaseRoute';
import { ApiResponse } from '@api/types';

export class ClustersRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/clusters');

        this.addRoute('/', {
            get: () => this.getClusters()
        });
    }

    public async getClusters(): Promise<ApiResponse> {
        const stats = await this.api.worker.request('getClusterStats', undefined);
        return this.ok(stats);
    }
}
