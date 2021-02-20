"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalCommand = void 0;
const utils_1 = require("../utils");
const command_1 = require("../core/command");
class EvalCommand extends command_1.BaseCommand {
    constructor(cluster) {
        super(cluster, {
            name: 'eval',
            category: utils_1.commandTypes.CAT
        });
        this.setHandlers({
            '{...code}': (msg, _, __, code) => this.eval(msg.author.id, code)
        });
    }
    async eval(userId, code) {
        if (code.startsWith(this.name))
            code = code.substring(this.name.length);
        if (code.startsWith('```') && code.endsWith('```'))
            [code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [code];
        const { success, result } = await this.cluster.eval(userId, code);
        return success
            ? `Input:${utils_1.codeBlock(code, 'js')}Output:${utils_1.codeBlock(result)}`
            : `An error occured!${utils_1.codeBlock(result)}`;
    }
}
exports.EvalCommand = EvalCommand;
//# sourceMappingURL=eval.js.map