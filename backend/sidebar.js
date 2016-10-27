let e = module.exports = {};

const commandType = {
    1: "General Commands",
    2: "PRIVATE ERROR",
    3: "NSFW Commands",
    4: "MUSIC ERROR",
    5: "Bot Commander",
    6: "Admin Commands"
};

const tagType = {
    1: 'Simple Tags',
    2: 'Complex Tags'
};

e.render = () => {
    let commands = bu.commands;
    let sidebar = `<ul id="slide-out" class="side-nav blue-grey darken-1">
	<li>
		<a href="/" class='grey-text text-lighten-5 main-brand waves-effect waves-light'>
                    blargbot
                </a>
	</li>
	<li>
		<a href="/dashboard" class='grey-text text-lighten-5 waves-effect waves-light'>Dashboard</a>
	</li>
	<li class='no-padding'>
		<ul class="collapsible collapsible-accordian">
			<li>
				<a class='collapsible-header grey-text text-lighten-5 waves-effect waves-light'>Commands<i class="material-icons right grey-text text-lighten-5" aria-hidden="true">keyboard_arrow_down</i></a>
				<div class='collapsible-body subbody'>
					<ul>
						<li class='sub-header blue-grey darken-2'><a href='/commands' class='grey-text text-lighten-5 waves-effect waves-light'>Command List</a></li>
                        `;
    let lastType = -10;
    for (let i = 0; i < commands.length; i++) {
        if (commands[i].type != lastType) {
            sidebar += `<li class=\"sidebar-header blue-grey darken-3\"><a class='grey-text text-lighten-5 waves-effect waves-light' href='/commands/#${commands[i].type}'>${commandType[commands[i].type]}</a></li>`;
            lastType = commands[i].type;
        }
        sidebar += `<li class='blue-grey darken-2'><a class='grey-text text-lighten-5 sidebar-dropdown waves-effect waves-light' href='/commands/#${commands[i].name}'>${commands[i].name}</a></li>`;
    }
    sidebar += `</ul>
              </div>
            </li></ul>
            </li>`;

    sidebar += `<li class='no-padding'>
             <ul class="collapsible collapsible-accordian">
              <li>
                <a class='collapsible-header grey-text text-lighten-5 waves-effect waves-light'>Tags<i class="material-icons right grey-text text-lighten-5" aria-hidden="true">keyboard_arrow_down</i></a>
              <div class='collapsible-body subbody'>
                 <ul>
                 <li class='sub-header blue-grey darken-2'><a href='/tags' class='grey-text text-lighten-5 waves-effect waves-light'>Tag List</a></li>`;
    lastType = -10;
    let tags = bu.tags;
    console.dir(tags);
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].type != lastType) {
            sidebar += `<li class=\"sidebar-header blue-grey darken-3\"><a class='grey-text text-lighten-5 waves-effect waves-light' href='/tags/#${tags[i].type}'>${tagType[tags[i].type]}</a></li>`;
            lastType = tags[i].type;
        }
        sidebar += `<li class='blue-grey darken-2'><a class='grey-text text-lighten-5 sidebar-dropdown waves-effect waves-light' href='/tags/#${tags[i].name}'>${tags[i].name}</a></li>`;
    }
    sidebar += `</ul>
              </div>
            </li></ul>
            </li>`;
    sidebar += '</ul>';
    return sidebar;
};

