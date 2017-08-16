let type = process.env.IMAGE_TYPE;
const Generator = require('../../Production/Image/Generators/' + type);
const generator = new Generator();
let args = JSON.parse(process.env.IMAGE_ARGS);

generator.generate(args).catch(err => {
    console.error('[IMG]' + err);
});