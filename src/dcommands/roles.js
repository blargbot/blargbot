var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.isCommand = true;

e.requireCtx = require;
e.hidden = false;
e.usage = 'roles';
e.info = 'Displays a list of roles and their IDs.';
e.longinfo = '<p>Displays a list of roles and their IDs.</p>';


e.execute = async function(msg) {
    var output;
    bu.send(msg, `The roles in **${msg.guild.name}**
\`\`\`prolog
${msg.guild.roles.filter(a => true).sort((a, b) => {
    return b.position - a.position;
}).map(r => r.id + ' ' + r.name).join('\n')}
\`\`\``);
};
