import prometheus from 'prom-client';

export const metrics = {
    registryCache: <prometheus.metric[][]>[],
    guildGauge: new prometheus.Gauge({
        name: 'bot_guild_gauge', help: 'How many guilds the bot is in'
    }),
    shardStatus: new prometheus.Gauge({
        name: 'bot_shard_status', help: 'The status of the shards',
        labelNames: ['status']
    }),
    userGauge: new prometheus.Gauge({
        name: 'bot_user_gauge', help: 'How many users the bot can see'
    }),
    messageCounter: new prometheus.Counter({
        name: 'bot_message_counter', help: 'Messages the bot sees'
    }),
    sendCounter: new prometheus.Counter({
        name: 'bot_send_counter', help: 'Messages the bot has sent'
    }),
    chatlogCounter: new prometheus.Counter({
        name: 'bot_chatlog_counter', help: 'ChatLogs created',
        labelNames: ['type']
    }),
    cleverbotStats: new prometheus.Counter({
        name: 'bot_cleverbot_counter', help: 'Calls to cleverbot made'
    }),
    commandCounter: new prometheus.Counter({
        name: 'bot_command_counter', help: 'Commands executed',
        labelNames: ['command', 'category']
    }),
    commandLatency: new prometheus.Histogram({
        name: 'bot_command_latency_ms', help: 'The latency of commands',
        labelNames: ['command', 'category'],
        buckets: [10, 100, 500, 1000, 2000, 5000]
    }),
    subtagCounter: new prometheus.Counter({
        name: 'bot_subtag_counter', help: 'Subtags executed',
        labelNames: ['subtag']
    }),
    subtagLatency: new prometheus.Histogram({
        name: 'bot_subtag_latency_ms', help: 'Latency of subtag execution',
        labelNames: ['subtag'],
        buckets: [0, 5, 10, 100, 500, 1000, 2000, 5000]
    }),
    commandError: new prometheus.Counter({
        name: 'bot_command_error_counter', help: 'Commands errored',
        labelNames: ['command']
    }),
    bbtagExecutions: new prometheus.Counter({
        name: 'bot_bbtag_executions', help: 'BBTag strings parsed',
        labelNames: ['type']
    }),
    httpsRequests: new prometheus.Counter({
        name: 'https_requests', help: 'HTTPS Requests',
        labelNames: ['method', 'endpoint']
    }),
    async getAggregated(): Promise<prometheus.Registry> {
        const c = [...metrics.registryCache];
        c.unshift(await prometheus.register.getMetricsAsJSON());
        return aggregate(c);
    }
};

function aggregate(regArray: prometheus.metric[][]): prometheus.Registry {
    const aggregated = prometheus.AggregatorRegistry.aggregate(regArray);
    return aggregated;
}

prometheus.collectDefaultMetrics();
