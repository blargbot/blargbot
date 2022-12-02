import { metrics } from '@blargbot/core/Metrics.js';

import { Api } from '../Api.js';
import { BaseRoute } from '../BaseRoute.js';

export class MetricsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/metrics');

        this.#api = api;

        this.addRoute('/', {
            get: async () => {
                const retrievedMetrics = await this.#api.worker.request('getMetrics', undefined);
                metrics.registryCache = Object.values(retrievedMetrics);
                const register = await metrics.getAggregated();

                return this.ok(await register.metrics(), register.contentType);
            }
        });
    }
}
