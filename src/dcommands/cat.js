var e = module.exports = {};
const Wolken = require('wolken');
const wolken = new Wolken(config.wolke, 'Wolke');

e.init = () => {
    e.category = bu.CommandType.IMAGE;
};

e.isCommand = true;

e.requireCtx = require;
e.hidden = false;
e.usage = 'cat';
e.info = 'Gets a picture of a cat.';
e.longinfo = '<p>Displays a picture of a dear sweet precious kitten.';


e.execute = async function (msg) {
    let res = await wolken.getRandom({ type: 'animal_cat', allowNSFW: false });
    await bu.send(msg, {
        embed: {
            image: {
                url: res.url
            },
            footer: {
                text: 'Powered by Weeb.sh'
            },
            color: bu.getRandomInt(0x1, 0xffffff)
        }
    })
};