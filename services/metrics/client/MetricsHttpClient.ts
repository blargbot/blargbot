import { defineApiClient } from '@blargbot/api-client';

import type { MetricJson } from './types.js';

export class MetricsHttpClient extends defineApiClient(b => b
    .withConfig<{ serviceName: string; instanceId: string; }>()
    .endpoint('postMetrics', b => b
        .arg<readonly MetricJson[]>()
        .route('POST', (_, x) => `${x.serviceName}/${x.instanceId}`)
        .body(x => new Blob([JSON.stringify(x)], { type: 'application/json' }))
        .response(204))
    .endpoint('getAllMetrics', b => b
        .route('')
        .response(200, b => b.text()))) {
}
