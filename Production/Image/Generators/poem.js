const Generator = require.main.require('./ImageGenerator');

class PoemGenerator extends Generator {
    async generate(args) {
        await super.generate(args);

        let base64 = await this.renderPhantom('poem.html', { replace1: args.text }, 1, 'PNG',
            function (name) {
                document.getElementById('replace1').classList.add(name);
            }, args.name);

        await this.send('poem.png', base64);
    }
}

module.exports = PoemGenerator;