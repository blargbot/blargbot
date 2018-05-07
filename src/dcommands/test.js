const BaseCommand = require('../structures/BaseCommand');

class TestCommand extends BaseCommand {
    constructor() {
        super({
            name: 'test',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == bu.CAT_ID) {
            let file = {
                file: "**Fresh Salmon**\n```diff\n\n+ Add custom ESP color for staff members!\n+ Different FOV/Config for Main/Secondary/Melee\n+ Add ESP for Ammo/Health Boxes/Packs.\n\n\n```\n**autism**\n```diff\n\n+ No-Recoil\n\n\n```\n**Forman Greeman**\n```diff\n\n+ Pills support\n\n\n```\n**Aeix**\n```diff\n\n+ auto swing on charge hit as demo(knight)\n\n\n```\n**Rooty**\n```diff\n\n+ fix for debug overlays (such as cl_showpos 1)\n~ keys for cheats replacing normal binds\n\n\n```\n**Loog**\n```diff\n\n+sv_pure bypass\n+Ignore condition\n+Custom Newline chatspam.\n+player list with ignore, priority options.\n~ fix aimbot for the classic\n\n\n```\n**Laske**\n```diff\n\n+Sentry Range Warning\n\n\n```\n**DICE**\n```diff\n\n+ Show anti-aims in thirdperson\n+ Ignore cloaked spys\n+ Remove newlines from chat\n\n\n```\n**Chaz**\n```diff\n\n+crit key\n~ save settings after closing the game.\n\n\n```\n**Milkyway Galaxy**\n```diff\n\n+Box style ESp\n+auto strafe\n\n\n```\n**Proud Kebab Muslim**\n```diff\n\n+glow\n\n\n```\n**NoBox**\n```diff\n\n+ Auti sticky\n+ Auto airblast\n~ Legit & rage mode for auto airblast; (legit limited to your fov.)\n+ Triggerbot\n\n\n```\n**randomness**\n```diff\n\n+ insert closes menu\n\n\n```\n**HoldLight**\n```diff\n\n+ configs (save config , new config , load config) if its possible.\n\n\n```\n**Mr_Eazzy**\n```diff\n\n+ Aim for sentry, dispenser, teleport\n\n\n```\n**Hold on!**\n```diff\n\n+ Legit (slow/smooth) aim\n\n\n```\n**W4lk3r**\n```diff\n\n+ Object ESP for money/spells/Pumpkin bombs.\n+ Adding different ESP for Staff member's of F1.\n\n\n```\n**Teh White Nigga Le Mohammed**\n```diff\n\n+ Aimbot For medigun\n+ Move Able Radar\n+ Legit Projectile Prediction\n+ Duck Shoot\n+ Duck And Shoot\n+ Kys\n+ Kys\n\n\n```\n**Stick**\n```diff\n\n+ Autostrafe\n+ make the esp more cleaner, stop having guid over name, health bars, custom colors\n+ chams\n+ glow\n+ besster bhop for scout\n+ multipoint\n+ followbot/healbot\n+ instant taunt\n+ auto vote (yes/no)\n+ moveable radar\n+ smooth aim\n+ anti smac\n+ newlines\n+ newlines spam\n+ spectator list\n+ better antiaims (fake sideways, fix lisp)\n+ melee crits\n+ custom color selection\n+ settings saver (file)\n+ disable antiaim on shot rather than if IN_ATTACK is set\n+ follow antiaims (follow 90, follow 180)\n+ lobby link copy/paste\n+ lobby id copy/paste\n+ lobby link to clipboard\n+ lobbyid to clipboard\n\n\n```\n**Fake China**\n```diff\n\n+ Aim to sentry\n\n\n```\n**𝅳𝅳𝅳𝅳𝅳𝅳𝅳𝅳𝅳𝅳Ace**\n```diff\n\n+Hitscan\n~Make projectile aimbot great again\n+ Multibox (instead of aim at 1 bone you can chose multiple hitbox to aim at )\n+min damage (minimum damage aimbot has to make)\n+ make esp show wich player have documents\n\n\n```",
                name: 'output.txt'
            };
            bu.send(msg, `Oops! I tried to send a message that was too long. If you think this is a bug, please report it!`, file);
        }
    }
}

module.exports = TestCommand;
