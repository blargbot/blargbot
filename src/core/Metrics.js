const Prometheus = require('prom-client');

const collectDefaultMetrics = Prometheus.collectDefaultMetrics;
collectDefaultMetrics();

const guildGauge = new Prometheus.Gauge({
    name: 'bot_guild_gauge', help: 'How many guilds the bot is in'
});

const shardStatus = new Prometheus.Gauge({
    name: 'bot_shard_status', help: 'The status of the shards',
    labelNames: ['status']
});

const userGauge = new Prometheus.Gauge({
    name: 'bot_user_gauge', help: 'How many users the bot can see'
});

const messageCounter = new Prometheus.Counter({
    name: 'bot_message_counter', help: 'Messages the bot sees'
});

const chatlogCounter = new Prometheus.Counter({
    name: 'bot_chatlog_counter', help: 'Chatlogs created',
    labelNames: ['type']
})

const commandCounter = new Prometheus.Counter({
    name: 'bot_command_counter', help: 'Commands executed',
    labelNames: ['command', 'category']
});

const commandLatency = new Prometheus.Histogram({
    name: 'bot_command_latency_ms', help: 'The latency of commands',
    labelNames: ['command', 'category'],
    buckets: [10, 100, 500, 1000, 2000, 5000]
});

const subtagLatency = new Prometheus.Histogram({
    name: 'bot_subtag_latency_ms', help: 'Latency of subtag execution',
    labelNames: ['subtag'],
    buckets: [0, 5, 10, 100, 500, 1000, 2000, 5000]
});

const commandError = new Prometheus.Counter({
    name: 'bot_command_error_counter', help: 'Commands errored',
    labelNames: ['command']
});

const bbtagExecutions = new Prometheus.Counter({
    name: 'bot_bbtag_executions', help: 'BBTag strings parsed',
    labelNames: ['type']
});

const aggregate = function (regArray) {
    let aggregated = Prometheus.AggregatorRegistry.aggregate(regArray);
    return aggregated;
}

module.exports = {
    Prometheus, aggregate, guildGauge, shardStatus, userGauge, messageCounter,
    chatlogCounter, commandCounter, commandError, commandLatency, bbtagExecutions,
    subtagLatency,
    registryCache: [],
    get aggregated() {
        let c = module.exports.registryCache.filter(m => true);
        c.unshift(Prometheus.register.getMetricsAsJSON());

        return aggregate(c);
    }
};