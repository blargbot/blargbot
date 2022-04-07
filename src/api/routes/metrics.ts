import { metrics } from '@blargbot/core/Metrics';

import { BaseRoute } from '../BaseRoute';

export class MetricsRoute extends BaseRoute {
    public constructor() {
        super('/metrics');

        this.addRoute('/', {
            get: async () => this.ok(await metrics.getAggregated())
        });
    }
}
