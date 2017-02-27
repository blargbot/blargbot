var e = module.exports = {};

e.init = () => {
    e.category = bu.TagType.SIMPLE;
};

e.requireCtx = require;

e.isTag = true;
e.name = `semi`;
e.args = ``;
e.usage = `{semi}`;
e.desc = `Will be replaced by <code>;</code> on execution.`;
e.exampleIn = `This is a semicolon! {semi}`;
e.exampleOut = `This is a semicolon! ;`;


e.execute = async function(params) {
    var replaceString = bu.specialCharBegin + 'SEMI' + bu.specialCharEnd;
    var replaceContent = false;


    return {
        terminate: params.terminate,
        replaceString: replaceString,
        replaceContent: replaceContent
    };
};