import { ApiConnection } from '@blargbot/api';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';
import Prometheus, { metric } from 'prom-client';

export class ApiGetMetricsHandler extends WorkerPoolEventService<ApiConnection, 'getMetrics'> {
    readonly #master: Master;

    public constructor(master: Master) {
        super(
            master.api,
            'getMetrics',
            async ({ reply }) => reply(await this.getCommand()));
        this.#master = master;
    }

    protected async getCommand(): Promise<Record<number | string, metric[]>> {
        const metrics = { ...this.#master.metrics, master: await Prometheus.register.getMetricsAsJSON() };
        return metrics;
    }
}
