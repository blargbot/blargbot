let e = module.exports = {};
const hbs = require('hbs');
const path = require('path');

const commandType = {
    1: "General Commands",
    2: "CAT ERROR",
    3: "NSFW Commands",
    4: "Image Commands",
    5: "MUSIC ERROR",
    6: "Admin Commands",
    perms: {
        1: 'None',
        2: 'None',
        3: 'None',
        4: 'None',
        5: 'None',
        6: 'Admin'
    }
};

const tagType = {
    1: "Simple Tags",
    2: "General Tags",
    3: "Array Tags"
};

e.init = () => {
    hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
    hbs.registerHelper('listcommands', function() {
        let sidebar = '';
        let commands = bu.commands;
        let lastType = -10;
        let keys = Object.keys(commands);
        keys.sort((a, b) => {
            return ((commands[a].category - commands[b].category) * 1000) + (a > b ? 1 : -1);
        });
        for (let i = 0; i < keys.length; i++) {
            if (commands[keys[i]].category != bu.CommandType.CAT && commands[keys[i]].category != bu.CommandType.MUSIC) {
                if (commands[keys[i]].category != lastType) {
                    sidebar += `<li class=\"sidebar-header blue-grey darken-3\"><a class='grey-text text-lighten-5 waves-effect waves-light' href='/commands/#${commands[keys[i]].category}'>${commandType[commands[keys[i]].category]}</a></li>`;
                    lastType = commands[keys[i]].category;
                }
                sidebar += `<li class='blue-grey darken-2'><a class='grey-text text-lighten-5 sidebar-dropdown waves-effect waves-light' href='/commands/#${keys[i]}'>${keys[i]}</a></li>`;
            }
        }
        return sidebar;
    });

    hbs.registerHelper('listtags', function() {
        let sidebar = '';
        let lastType = -10;
        let tags = bu.tags;
        let keys = Object.keys(tags);
        keys.sort((a, b) => {
            return ((tags[a].category - tags[b].category) * 1000) + (a > b ? 1 : -1);
        });
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (tags[key].category != lastType) {
                sidebar += `<li class=\"sidebar-header blue-grey darken-3\"><a class='grey-text text-lighten-5 waves-effect waves-light' href='/tags/#${tags[key].category}'>${tagType[tags[key].category]}</a></li>`;
                lastType = tags[key].category;
            }
            sidebar += `<li class='blue-grey darken-2'><a class='grey-text text-lighten-5 sidebar-dropdown waves-effect waves-light' href='/tags/#${key}'>${key}</a></li>`;
        }
        return sidebar;
    });

    hbs.registerHelper('tags', function(text, url) {
        let toReturn = '';
        let lastType = -10;
        let tags = bu.tags;
        let keys = Object.keys(tags);
        keys.sort((a, b) => {
            return ((tags[a].category - tags[b].category) * 1000) + (a > b ? 1 : -1);
        });
        // logger.debug(tags);
        for (let i = 0; i < keys.length; i++) {
            if (tags[keys[i]].category != lastType) {
                lastType = tags[keys[i]].category;
                if (lastType == 1) {
                    toReturn += `
                <div class="row">
                <div class=\"centre\" id=\"simple\">
        <h2 id='${lastType}' class='white-text'>${tagType[lastType]}</h2>
    </div>
        <div class="col s10 offset-s1 m10 offset-m1 l10 offset-l1">
            <p class="centre">These tags are just simple replaces, and don't take any arguments.</p>
        </div>
    </div><div class="row">
        <div class="col s12 m10 offset-m1 l10 offset-l1">
            `;
                } else if (lastType == 2) {
                    toReturn += `
        </div>
    </div>

    <div class="row">
        <div class=\"centre\" id=\"complex\">
            <h2 class='white-text'>Complex</h2>
        </div>
    <div class="col s10 offset-s1 m8 offset-m2 l6 offset-l3">
        <p class="centre">These tags are more powerful.<br>
            &lt;&gt; - denotes required arguments<br>
            [] - denotes optional arguments<br>
            ... - denotes one or more arguments </p>
    </div></div>`;
                    toReturn += `<div class='row'>
        <h3 class='centre' id='${lastType}'>${bu.TagType.properties[lastType].name}</h3>
        <p class='flow-text centre'>${bu.TagType.properties[lastType].desc}</p>
    </div>`;

                    toReturn += `<div class="row">
        <div class="col s12 m10 offset-m1 l10 offset-l1">`;
                } else {
                    toReturn += '</div></div>';
                    toReturn += `<div class='row'>
        <h3 class='centre' id='${lastType}'>${bu.TagType.properties[lastType].name}</h3>
        <p class='flow-text centre'>${bu.TagType.properties[lastType].desc}</p>
    </div>`;
                    toReturn += `<div class="row">
        <div class="col s12 m10 offset-m1 l10 offset-l1">`;
                }
            }
            let colour = 'blue-grey darken-2';
            if (tags[keys[i]].deprecated) colour = 'red darken-4';
            toReturn += `<div class="card ${colour}"><div class="card-content">`;
            toReturn += `<h4 id='${keys[i]}'>${keys[i]}</h4>`;
            if (tags[keys[i]].deprecated) {
                toReturn += `<p>This tag is deprecated. Avoid using it, as it will eventually become unsupported.</p>`;
            }
            if (lastType != 1) {
                toReturn += `<p>Arguments: <code>${tags[keys[i]].args}</code></p>`;
            }
            if (tags[keys[i]].array) toReturn += `<p>Array compatible</p>`;
            toReturn += `<p>${tags[keys[i]].desc}</p>`;

            toReturn += `<h5>Example Input:</h5><blockquote>${tags[keys[i]].exampleIn}</blockquote>`;
            toReturn += `<h5>Example Output:</h5><blockquote>${tags[keys[i]].exampleOut}</blockquote>`;
            toReturn += ' </div></div>';
        }
        toReturn += `
                   
        </div>
    </div`;
        return toReturn;
    });

    hbs.registerHelper('tagseditor', (text, url) => {
        let tags = Object.keys(bu.tags).map(m => {
            return {
                text: m,
                displayText: bu.tags[m].usage
            };
        });
        tags.push('dummy');
        return JSON.stringify(tags);
    });




    hbs.registerHelper('commands', function(text, url) {
        let toReturn = '';
        let lastType = -10;
        let commands = bu.commands;
        let keys = Object.keys(commands);
        keys.sort((a, b) => {
            return ((commands[a].category - commands[b].category) * 1000) + (a > b ? 1 : -1);
        });
        for (let i = 0; i < keys.length; i++) {
            if (commands[keys[i]].category != bu.CommandType.CAT && commands[keys[i]].category != bu.CommandType.MUSIC) {
                if (commands[keys[i]].category != lastType) {
                    toReturn += `<div class='centre white-text'><h2 id='${commands[keys[i]].category}' class='white-text'>${commandType[commands[keys[i]].category]}</h2></div>`;
                    lastType = commands[keys[i]].category;
                }
                toReturn += "<div class='row'>";
                toReturn += "<div class='col s12 m10 offset-m1 l10 offset-l1'>";
                toReturn += `<div class=\"card blue-grey darken-3\" id='${keys[i]}'>`;
                toReturn += "<div class='card-content'>";
                toReturn += `<span class='card-title'>${keys[i]}</span>`;
                toReturn += `<p>Usage: <pre style="margin: 0" class="wrap"><code>${commands[keys[i]].usage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></p>`;
                toReturn += `<p>Role Needed: ${commandType.perms[commands[keys[i]].category]}</p>`;
                toReturn += commands[keys[i]].longinfo;
                let flags = commands[keys[i]].flags;
                if (flags) {
                    toReturn += `<p>Flags:</p><ul>`;
                    for (let flag of flags) {
                        toReturn += `<li><code>-${flag.flag}</code>/<code>--${flag.word}</code> - ${flag.desc}</li>`
                    }
                    toReturn += '</ul>';
                }
                toReturn += "</div>";
                toReturn += "</div>";
                toReturn += "</div>";
                toReturn += "</div>";
            }
        }
        return toReturn;
    });
};