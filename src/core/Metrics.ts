import Prometheus from 'prom-client';

export class Metrics {
    public readonly registryCache: Array<Prometheus.metric>[]; // TODO nested array?
    public readonly guildGauge: Prometheus.Gauge;
    public readonly shardStatus: Prometheus.Gauge;
    public readonly userGauge: Prometheus.Gauge;
    public readonly messageCounter: Prometheus.Counter;
    public readonly sendCounter: Prometheus.Counter;
    public readonly chatlogCounter: Prometheus.Counter;
    public readonly commandCounter: Prometheus.Counter;
    public readonly commandLatency: Prometheus.Histogram;
    public readonly subtagLatency: Prometheus.Histogram;
    public readonly commandError: Prometheus.Counter;
    public readonly bbtagExecutions: Prometheus.Counter;
    public readonly httpsRequests: Prometheus.Counter;

    get aggregated() {
        let c = this.registryCache.filter(m => true);
        c.unshift(Prometheus.register.getMetricsAsJSON());

        return this.aggregate(c);
    }

    constructor() {
        this.registryCache = [];
        this.guildGauge = new Prometheus.Gauge({
            name: 'bot_guild_gauge', help: 'How many guilds the bot is in'
        });

        this.shardStatus = new Prometheus.Gauge({
            name: 'bot_shard_status', help: 'The status of the shards',
            labelNames: ['status']
        });

        this.userGauge = new Prometheus.Gauge({
            name: 'bot_user_gauge', help: 'How many users the bot can see'
        });

        this.messageCounter = new Prometheus.Counter({
            name: 'bot_message_counter', help: 'Messages the bot sees'
        });

        this.sendCounter = new Prometheus.Counter({
            name: 'bot_send_counter', help: 'Messages the bot has sent'
        });

        this.chatlogCounter = new Prometheus.Counter({
            name: 'bot_chatlog_counter', help: 'Chatlogs created',
            labelNames: ['type']
        });

        this.commandCounter = new Prometheus.Counter({
            name: 'bot_command_counter', help: 'Commands executed',
            labelNames: ['command', 'category']
        });

        this.commandLatency = new Prometheus.Histogram({
            name: 'bot_command_latency_ms', help: 'The latency of commands',
            labelNames: ['command', 'category'],
            buckets: [10, 100, 500, 1000, 2000, 5000]
        });

        this.subtagLatency = new Prometheus.Histogram({
            name: 'bot_subtag_latency_ms', help: 'Latency of subtag execution',
            labelNames: ['subtag'],
            buckets: [0, 5, 10, 100, 500, 1000, 2000, 5000]
        });

        this.commandError = new Prometheus.Counter({
            name: 'bot_command_error_counter', help: 'Commands errored',
            labelNames: ['command']
        });

        this.bbtagExecutions = new Prometheus.Counter({
            name: 'bot_bbtag_executions', help: 'BBTag strings parsed',
            labelNames: ['type']
        });

        this.httpsRequests = new Prometheus.Counter({
            name: 'https_requests', help: 'HTTPS Requests',
            labelNames: ['method', 'endpoint']
        });

        Prometheus.collectDefaultMetrics();
    }

    aggregate(regArray: Array<Prometheus.metric>[]) { // TODO Nested array?
        let aggregated = Prometheus.AggregatorRegistry.aggregate(regArray);
        return aggregated;
    };
}