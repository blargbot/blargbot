const Generator = require.main.require('./ImageGenerator');

class PoemGenerator extends Generator {
  async generate(args) {
    await super.generate(args);
    if (!args.text) args.text = 'Just Monika.';
    let base64 = await this.renderPhantom('poem.html', { replace1: args.text }, 2, 'PNG',
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

        var el, elements, _i, _len, _results, wrapper;
        elements = document.getElementsByClassName('resize');
        wrapper = document.getElementById('wrapper');
        if (elements.length < 0) {
          return;
        }
        _results = [];
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          el = elements[_i];
          _results.push((function (el) {
            var resizeText, _results1;
            if (el.style['font-size'] === '') el.style['font-size'] = '44px';
            if (el.style['line-height'] === '') el.style['font-size'] = '44px';
            resizeText = function () {
              var elNewFontSize;
              elNewFontSize = (parseInt(el.style.fontSize.slice(0, -2)) - 1) + 'px';
              el.style.fontSize = elNewFontSize;
              el.style.lineHeight = elNewFontSize;

              return el;
            };
            _results1 = null;
            var ii = 0;
            while (el.scrollHeight > wrapper.clientHeight) {
              _results1 = resizeText();
              if (++ii == 1000) break;

            }
            return _results1;
          })(el));
        }
        return _results;
      }, { name: args.name, yuri: args.yuri });

    await this.send('poem.png', base64);
  }

}

module.exports = PoemGenerator;