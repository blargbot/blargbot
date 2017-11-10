const Generator = require.main.require('./ImageGenerator');

class PoemGenerator extends Generator {
    async generate(args) {
        await super.generate(args);
        if (!args.text) args.text = 'Just Monika.';
        let base64 = await this.renderPhantom('poem.html', { replace1: args.text }, 1, 'PNG',
            function (args) {
                document.getElementById('replace1').classList.add(args.name);
                if (args.name === 'yuri' && args.yuri) {
                    var variation = '';
                    switch (args.yuri) {
                        case '1':
                            variation = 'y1';
                            break;
                        case '2':
                            variation = 'y2';
                            break;
                    }
                    if (variation) {
                        document.getElementById('workspace').classList.add(variation);
                        document.getElementById('replace1').classList.remove(args.name);
                        document.getElementById('replace1').classList.add(variation === 'y1' ? 'yuri1' : 'yuri2');
                    }
                }
            }, { name: args.name, yuri: args.yuri });

        await this.send('poem.png', base64);
    }
}

module.exports = PoemGenerator;