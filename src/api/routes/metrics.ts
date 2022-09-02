import { metrics } from '@blargbot/core/Metrics';

import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class MetricsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/metrics');

        this.#api = api;

        this.addRoute('/', {
            get: () => this.getMetrics()
        });
    }

    public async getMetrics(): Promise<ApiResponse> {
        const retrievedMetrics = await this.#api.worker.request('getMetrics', undefined);
        metrics.registryCache = Object.values(retrievedMetrics);
        const register = await metrics.getAggregated();

        return this.ok(await register.metrics(), register.contentType);
    }
}
