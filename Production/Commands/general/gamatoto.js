const { GeneralCommand } = require('../../../Core/Structures/Command');
const reload = require('require-reload')(require);
const { dialog, locations } = reload('../../../gamatoto.json');
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
                expeditionBegins: { key: '.expeditionbeings', value: '<:bc_cat:345081695990710272> THE SEARCH BEGINS! <:bc_cat:345081695990710272>\n\nLocation: {{location}}\n\nPlease check back later by doing `gamatoto end`!' },
                expeditionEnds: { key: '.expeditionends', value: '<:bc_cat:345081695990710272> EXPEDITION RESULTS! <:bc_cat:345081695990710272>\n\nLocation: {{location}}\nDuration: {{minutes}} minutes\n\n{{results}}' },
                noTimeElapsed: { key: '.notimeelapsed', value: 'No time has elapsed since the expedition started. Gamatoto didn\'t find anything!' },
                itemFound: { key: '.itemfound', value: 'Gamatoto found {{amount}} {{item}} at the {{location}}.' },
                levelUp: { key: '.levelup', value: ':fireworks: Gamatoto is now level {{level}}!' },
                gamatotoXp: { key: '.gamatotoxp', value: 'Gamatoto gained **{{amount}}**XP ({{old}} → **{{new}}**)' },
                itemIncrease: { key: '.itemincrease', value: '{{item}} You found **{{amount}}** ({{old}} → **{{new}}**)' },

                wrongLevel: { key: '.wronglevel', value: 'Sorry, you need to be level {{level}} in order to explore that place!' },

                gamatotoItems: { key: '.gamatotoitems', value: 'Here are your items:\n{{items}}' },
                gamatotoStats: { key: '.gamatotostats', value: 'Gamatoto is currently level {{level}}! [{{currentxp}}XP/{{neededxp}}XP]' },
                gamatotoCurrent: { key: '.gamatotocurrent', value: 'Gamatoto has been exploring the **{{location}}** for **{{minutes}}** minutes.\n\nUse `gamatoto end` to end the expedition.' },
                gamatotoIdle: { key: '.gamatotoidle', value: 'Gamatoto isn\'t on an expedition right now. Send him on an adventure by doing `gamatoto start [location]`!' }
            },
            info: 'Go on a magical expedition with Gamatoto!',
            subcommands: {
                check: { info: 'Checks the progress of the current expedition, as well as the items you have.', usage: 'check', aliases: ['items'] },
                start: { aliases: ['begin'], info: 'Starts an expedition!', usage: 'start <location>' },
                end: { aliases: ['finish'], usage: 'finish', info: 'Ends an expedition!' }
            }
        });
    }

    get goodieBag() {
        return {
            xp: 0,
            ketfud: 0,
            speed: 0,
            treasure: 0,
            rich: 0,
            cpu: 0,
            jobs: 0,
            sniper: 0
        };
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
        let output = '';
        let gamatoto = await ctx.author.data.getGamatoto();
        let xp = await ctx.author.data.getGamatotoXp();
        let level = this.getGamatotoLevel(xp) + 1;
        let nextLevel = this.levels[level];

        let items = '';
        for (const key in gamatoto) {
            items += `${this.emotes[key]} **${gamatoto[key]}**\n`;
        }
        output += await ctx.decode(this.keys.gamatotoStats, { level, currentxp: xp, neededxp: nextLevel }) + '\n\n';

        output += await ctx.decode(this.keys.gamatotoItems, { items }) + '\n';

        let start = await ctx.author.data.getGamatotoStart();
        if (start === null) {
            output += await ctx.decode(this.keys.gamatotoIdle);
        } else {
            let diff = moment.duration(moment() - start);
            let minutes = Math.floor(diff.asMinutes());
            let location = await ctx.author.data.getGamatotoLocation();
            output += await ctx.decode(this.keys.gamatotoCurrent, { location: locations[location].name, minutes });
        }
        return output;
    }

    async sub_check(ctx) {
        return await this.execute(ctx);
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
        if (typeof location === 'string')
            location = location.replace(/[^a-z0-9]/g, '').toLowerCase();
        let xp = await ctx.author.data.getGamatotoXp();
        if (!locations.hasOwnProperty(location)) {
            return await ctx.decodeAndSend(this.keys.noLocation, {
                locations: Object.values(locations)
                    .filter(l => this.getGamatotoLevel(xp) >= l.required)
                    .map(l => ' - ' + l.name).join('\n')
            });
        }
        if (this.getGamatotoLevel(xp) < locations[location].required) {
            return await ctx.decodeAndSend(this.keys.wrongLevel, { level: locations[location].required + 1 });
        }

        await ctx.author.data.setGamatotoStart(Date.now(), location);
        return await ctx.decodeAndSend(this.keys.expeditionBegins, { location: locations[location].name });
    }

    async sub_end(ctx) {
        let start = await ctx.author.data.getGamatotoStart();
        if (start === null) {
            return await ctx.decodeAndSend(this.keys.notStarted);
        }
        await ctx.author.data.setGamatotoStart(null);

        let diff = moment.duration(moment() - start);
        let minutes = Math.floor(diff.asMinutes());
        if (minutes === 0) {
            return ctx.decodeAndSend(this.keys.noTimeElapsed);
        }
        let locationKey = await ctx.author.data.getGamatotoLocation();
        let location = locations[locationKey];
        if (!location) return await ctx.decodeAndSend(this.keys.invalidLocation);

        let displayMin = minutes, behindMin = 0;
        if (minutes > 15) {
            displayMin = 15;
            behindMin = minutes - 15;
        }
        let output = '';
        let goodieBag = this.goodieBag;
        for (let i = 0; i < displayMin; i++) {
            let res = this.calculateReward(location, goodieBag);
            if (res === false) {
                output += 'Gamatoto '
                    + dialog.prefix[this.client.Helpers.Random.randInt(0, dialog.prefix.length)]
                    + ' '
                    + dialog.suffix[this.client.Helpers.Random.randInt(0, dialog.suffix.length)]
                    + '\n';

            } else {
                goodieBag[res.type] += res.amount;
                output += await ctx.decode(this.keys.itemFound, { amount: res.amount, item: this.emotes[res.type], location: location.name }) + '\n';
            }
        }
        for (let i = 0; i < behindMin; i++) {
            let res = this.calculateReward(location, goodieBag);
            if (res !== false) {
                goodieBag[res.type] += res.amount;
            }
        }
        output += '\n';

        let oldStats = await ctx.author.data.getGamatoto();
        for (const key in goodieBag) {
            if (goodieBag[key] !== 0) {
                output += await ctx.decode(this.keys.itemIncrease, { amount: goodieBag[key], item: this.emotes[key], old: oldStats[key], new: oldStats[key] + goodieBag[key] }) + '\n';
                oldStats[key] += goodieBag[key];
            }
        }

        await ctx.author.data.setGamatoto(oldStats);
        let xp = minutes * location.xp;
        let oldXp = await ctx.author.data.getGamatotoXp();
        let newXp = oldXp + xp;
        await ctx.author.data.setGamatotoXp(newXp);
        output += '\n' + await ctx.decode(this.keys.gamatotoXp, { amount: xp, old: oldXp, new: newXp }) + '\n';
        if (this.getGamatotoLevel(oldXp) != this.getGamatotoLevel(newXp)) {
            output += await ctx.decode(this.keys.levelUp, { level: this.getGamatotoLevel(newXp) + 1 }) + '\n';
        }
        return await ctx.decodeAndSend(this.keys.expeditionEnds, { location: location.name, minutes, results: output });
    }

    calculateReward(location) {
        let choices = [];
        let chances = [];
        for (const item of location.items) {
            choices.push(item);
            chances.push(item.seed);
        }
        let res = this.client.Helpers.Random.chancePool(choices, chances);
        let obtained = this.client.Helpers.Random.chance(res.rate * 100, 10000);
        if (!obtained) return false;

        let amount = this.client.Helpers.Random.randInt(res.amount[0], res.amount[1]);

        return { type: res.type, amount };
    }
}

module.exports = GamatotoCommand;