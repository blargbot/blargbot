import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

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
