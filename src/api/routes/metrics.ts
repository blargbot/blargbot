import { metrics } from '@blargbot/core/Metrics';

import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class MetricsRoute extends BaseRoute {
    public constructor() {
        super('/metrics');

        this.addRoute('/', {
            get: ({ api }) => this.getMetrics(api)
        });
    }

    public async getMetrics(api: Api): Promise<ApiResponse> {
        const retrievedMetrics = await api.worker.request('getMetrics', undefined);
        metrics.registryCache = Object.values(retrievedMetrics);
        const register = await metrics.getAggregated();

        return this.ok(await register.metrics(), register.contentType);
    }
}
