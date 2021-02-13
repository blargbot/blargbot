"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalCommand = void 0;
const utils_1 = require("../utils");
const BaseDCommand_1 = require("../structures/BaseDCommand");
class EvalCommand extends BaseDCommand_1.BaseDCommand {
    constructor(cluster) {
        super(cluster, 'eval', {
            category: utils_1.commandTypes.CAT
        });
    }
    async execute(msg, _, text) {
        if (text.startsWith(this.name))
            text = text.substring(this.name.length);
        if (text.startsWith('```') && text.endsWith('```'))
            [text] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(text) ?? [text];
        const { success, result } = await this.cluster.eval(msg.author.id, text);
        const response = success
            ? `Input:${utils_1.codeBlock(text, 'js')}Output:${utils_1.codeBlock(result)}`
            : `An error occured!${utils_1.codeBlock(result)}`;
        await this.send(msg, response);
    }
}
exports.EvalCommand = EvalCommand;
//# sourceMappingURL=eval.js.map