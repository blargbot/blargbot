const { GeneralCommand } = require('../../../Core/Structures/Command');
const reload = require('require-reload')(require);
const locations = reload('../../../gamatoto.json');
const moment = require('moment');

class GamatotoCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'gamatoto',
            keys: {
                stats: { key: '.stats', value: '<:bc_cat:345081695990710272> Here are your items!\n\n{{stats}}' },
                alreadyStarted: { key: '.alreadystarted', value: 'An expedition is already in progress!' },
                notStarted: { key: '.notstarted', value: `You haven't started an expedition!` },
                noLocation: { key: '.nolocation', value: `Sorry, that wasn't a valid location. The locations you can currently visit are:\n\n{{locations}}` },
                invalidLocation: { key: '.invalidlocation', value: 'Something weird happened. The place you were exploring no longer exists! Please start another expedition.' },
                expeditionBegins: { key: '.expeditionbeings', value: '<:bc_cat:345081695990710272> THE SEARCH BEGINS! <:bc_cat:345081695990710272>\n\nLocation: {{location}}' }
            },
            info: 'Go on a magical expedition with Gamatoto!',
            subcommands: {
                check: { info: 'Checks the progress of the current expedition.', usage: 'check' },
                start: { aliases: ['begin'], info: 'Starts an expedition!', usage: 'start <location>' },
                end: { aliases: ['finish'], usage: 'finish' },
                items: { usage: 'items', aliases: ['stats'] }
            }
        });
    }

    get emotes() {
        return {
            xp: '<:bc_xp:345077450084188162>',
            ketfud: '<:bc_catfood:345077450146971648>',
            speed: '<:bc_speedup:345080075747590144>',
            treasure: '<:bc_treasureradar:345080076070682634>',
            rich: '<:bc_richcat:345080075953373187>',
            cpu: '<:bc_catcpu:345080076343443456>',
            jobs: '<:bc_catjobs:345080076322340864>',
            sniper: '<:bc_snipercat:345080076565610498>'
        };
    }

    get levels() {
        return [0, 600, 2400, 10900, 16900, 23000, 44100, 65300, 86500, 107700, 168200, 228700,
            289200, 349700, 444000, 538400, 632800, 727200, 821600, 1729100, 2860400, 4312400,
            4590700, 4869000, 5982100, 6260500, 8462700, 11142900, 14614000, 16985600, 19320720];
    }

    getGamatotoLevel(xp) {
        let achieved = this.levels.filter(l => l <= xp);
        return this.levels.indexOf(achieved[achieved.length - 1]);
    }

    async execute(ctx) {

    }

    async sub_check(ctx) {

    }

    async sub_start(ctx) {
        let start = await ctx.author.data.getGamatotoStart();
        if (start !== null) {
            return await ctx.decodeAndSend(this.keys.alreadyStarted);
        }
        let location;
        if (ctx.input._.length > 0)
            location = ctx.input._.raw.join('');
        else location = await ctx.author.data.getGamatotoLocation();
        location = location.replace(/[^a-z0-9]/g, '').toLowerCase();
        if (!locations.hasOwnProperty(location)) {
            return await ctx.decodeAndSend(this.keys.noLocation, { locations: Object.values(locations).map(l => ' - ' + l.name).join('\n') });
        }

        await ctx.author.data.setGamatotoStart(Date.now(), location);
        return await ctx.decodeAndSend(this.keys.expeditionBegins);
    }

    async sub_end(ctx) {
        let start = await ctx.author.data.getGamatotoStart();
        if (start === null) {
            return await ctx.decodeAndSend(this.keys.notStarted);
        }

        let diff = moment.duration(moment() - start);
        let minutes = diff.asMinutes();
        let locationKey = await ctx.author.data.getGamatotoLocation();
        let location = locations[locationKey];
        if (!location) return await ctx.decodeAndSend(this.keys.invalidLocation);

        let displayMin = minutes, behindMin = 0;
        if (minutes > 60) {
            displayMin = 60;
            behindMin = minutes - 60;
        }

        for (let i = 0; i < displayMin.length; i++) {

        }
    }

    calculateReward(location) {

    }

    async sub_items(ctx) {
        let stats = await ctx.author.data.getGamatoto();
        let output = '';
        for (const key in this.emotes) {
            if (stats[key] !== undefined) {
                output += `${this.emotes[key]} ${stats[key]}\n`;
            }
        }
        return await ctx.decodeAndSend(this.keys.stats, { stats: output });
    }
}

module.exports = GamatotoCommand;