import { metrics } from '@blargbot/core/Metrics';
import { Api } from '../Api';

import { BaseRoute } from '../BaseRoute';

export class MetricsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/metrics');

        this.addRoute('/', {
            get: async () => {
                const retrievedMetrics = await this.api.worker.request('getMetrics', undefined);
                metrics.registryCache = Object.values(retrievedMetrics);
                const register = await metrics.getAggregated();
                
                return this.ok(await register.metrics(), register.contentType);
            }
        });
    }
}
