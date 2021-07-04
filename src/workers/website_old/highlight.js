const hljs = require('highlight.js');
const showdown = require('showdown');

showdown.extension('codehighlight', function () {
    function htmlunencode(text) {
        return (
            text
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
        );
    }
    return [
        {
            type: 'output',
            filter: function (text) {
                // use new shodown's regexp engine to conditionally parse codeblocks
                let left = '<pre><code\\b[^>]*>';
                let right = '</code></pre>';
                let flags = 'g';
                let replacement = function (wholeMatch, match, left, right) {
                    // unescape match to prevent double escaping
                    match = htmlunencode(match);
                    return left + hljs.highlightAuto(match).value + right;
                };
                return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
            }
        }
    ];
});
