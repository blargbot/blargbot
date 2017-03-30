var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `messageid`;
e.args = ``;
e.usage = `{messageid}`;
e.desc = `Returns the ID of the invoking message.`;
e.exampleIn = `The message id was {messageid}`;
e.exampleOut = `The message id was 111111111111111111`;

e.execute = async function (params) {
    var replaceString = params.msg.id;
    var replaceContent = false;

    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};