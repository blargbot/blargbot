var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `lb`;
e.args = ``;
e.usage = `{lb}`;
e.desc = `Will be replaced by <code>{</code> on execution.`;
e.exampleIn = `This is a bracket! {lb}`;
e.exampleOut = `This is a bracket! {`;


e.execute = async function(params) {

    var replaceString = bu.specialCharBegin + 'LB' + bu.specialCharEnd;
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};