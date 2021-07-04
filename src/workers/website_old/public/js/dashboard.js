let data;

$(function () {
    $('#save_btn').click(function save() {
        if (!data) return;
        let keys = Object.keys(data.data.guild.settings);
        for (let i = 0; i < keys.length; i++) {
            let element = document.getElementById(keys[i]);

            if (element) {
                switch (element.type) {
                    case 'checkbox':
                        data.data.guild.settings[keys[i]] = element.checked;
                        break;
                    default:
                        data.data.guild.settings[keys[i]] = element.value;
                        break;
                }
            }
        }
        sendData('saveGuild', data.data.guild);
    });
});

wss.onmessage = function (event) {
    data = JSON.parse(event.data);
    console.dir(data);
    if (data.code == 200) {
        switch (data.data.type) {
            case 'guildSaved':
                console.dir(data);
                Materialize.toast(data.data.data, 5000);
                break;
            case 'displayGuild': {
                let settings = data.data.guild.settings;
                let keys = Object.keys(settings);
                document.getElementById('modal-guild').innerText = 'Settings for ' + data.data.guild.guild.name;

                let channelSelectors = document.getElementsByClassName('channel-selector');
                let channels = data.data.guild.guild.channels;
                for (let i = 0; i < channelSelectors.length; i++) {
                    let select = channelSelectors[i];
                    if (select.tagName == 'SELECT') {
                        let defaultVal = select.getAttribute('data-default');
                        if (defaultVal == 'none') {
                            let channel = document.createElement('option');
                            channel.setAttribute('value', '');
                            channel.setAttribute('selected', '');
                            channel.text = 'None';
                            select.appendChild(channel);
                        }
                        for (let ii = 0; ii < channels.length; ii++) {
                            if (channels[ii].type == 0) {
                                let channel = document.createElement('option');
                                channel.setAttribute('value', channels[ii].id);
                                if (channels[ii].id == data.data.guild.guildid && defaultVal == 'default') {
                                    channel.setAttribute('selected', '');
                                }
                                channel.text = channels[ii].name;
                                select.appendChild(channel);
                            }
                        }
                    }
                }

                let roleSelectors = document.getElementsByClassName('role-selector');
                let roles = data.data.guild.guild.roles;
                for (let i = 0; i < roleSelectors.length; i++) {
                    let select = roleSelectors[i];
                    if (select.tagName == 'SELECT') {
                        let defaultVal = select.getAttribute('data-default');
                        if (defaultVal == 'none') {
                            let role = document.createElement('option');
                            role.setAttribute('value', '');
                            role.setAttribute('selected', '');
                            role.text = 'None';
                            select.appendChild(role);
                        }
                        for (let ii = 0; ii < roles.length; ii++) {
                            let role = document.createElement('option');
                            role.setAttribute('value', roles[ii].id);
                            role.text = roles[ii].name;
                            if (roles[ii].color != '') {
                                let roleText = document.createElement('div');
                                roleText.className += 'colored-class';
                                roleText.setAttribute('data-color', roles[ii].color);
                                role.appendChild(roleText);
                            }
                            select.appendChild(role);
                        }
                    }
                }

                for (let i = 0; i < keys.length; i++) {
                    let element = document.getElementById(keys[i]);

                    let value = settings[keys[i]];

                    if (element) {
                        switch (element.type) {
                            case 'checkbox':
                                value = value != '0';
                                element.checked = value;
                                break;
                            default:
                                element.value = value;
                                break;
                        }
                    }
                }

                Materialize.updateTextFields();
                $('select').material_select();

                let toColor = document.getElementsByClassName('colored-class');
                for (let i = 0; i < toColor.length; i++) {
                    let element = toColor[i];
                    let parent = element.parentElement;
                    if (parent.tagName == 'SPAN') {
                        parent.setAttribute('style', 'color: ' + element.getAttribute('data-color'));

                    }
                    //   element.remove();
                }
                for (let i = 0; i < toColor.length; i++) {
                    toColor[i].remove();
                }
                let inputs = document.getElementsByTagName('INPUT');
                for (let i = 0; i < inputs.length; i++) {
                    if (inputs[i].getAttribute('value')) {
                        let index = inputs[i].getAttribute('value').indexOf('<div class="colored-class" data-color=');
                        if (index > -1) {
                            inputs[i].setAttribute('value', inputs[i].getAttribute('value').substring(0, index));
                        }
                    }
                }

                $('#settings-modal').openModal({
                    dismissible: false
                });

                break;
            }
        }
    } else {
        Materialize.toast(data.data, 5000);
    }
};

function sendData(type, data) {
    wss.send(JSON.stringify({
        type,
        sid,
        data
    }));
}
