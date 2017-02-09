var e = module.exports = {};


e.init = () => {
    e.category = bu.CommandType.GENERAL;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'brainfuck <code>';
e.info = 'Executes brainfuck code.';
e.longinfo = `<p>Executes brainfuck code.</p>`;

e.execute = async function(msg, words) {
    if (words.length == 1) {
        bu.send(msg, 'Not enough parameters! Do `b!help brainfuck` for more details.');
        return;
    }
    try {
        let output = await bu.brainfuck(words.slice(1).join(' '));
        bu.send(msg, output.length == 0 ? 'No output...' : `Output:\n${output}`);
    } catch (err) {
        logger.error(err);
        bu.send(msg, `Something went wrong!
Error: \`${err.message}\``);
    }

};