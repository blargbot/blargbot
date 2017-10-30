<template>
  <div>
    <div class='row'>
      <form class='col s12 m6 blue-grey darken-1 escape-form'>
        <div class='row'>
          <div class='input-field col s12'>
            <input type='text' maxlength="256" data-length="256" v-model='embed.title' id='tbTitle'></input>
            <label for='tbTitle' class='grey-text text-lighten-2'>Title</label>
          </div>
          <div class='input-field col s12 m12'>
            <textarea maxlength="2048" data-length="2048" v-model='embed.description' id='tbDesc' class='materialize-textarea'></textarea>
            <label for='tbDesc' class='grey-text text-lighten-2'>Description</label>
          </div>
          <div class='input-field col s12 m6'>
            <input type='text' v-model='embed.url' id='tbUrl'></input>
            <label for='tbUrl' class='grey-text text-lighten-2'>URL</label>
          </div>
          <div class='input-field col s12 m6'>
            <input type='text' :style="'border-bottom: 5px solid ' + embed.color" v-on:change='validateColor' v-model='embed.color' id='tbColor'></input>
            <label for='tbColor'  class='grey-text text-lighten-2 active'>Color</label>
          </div>
          <div class='input-field col s12 m6'>
            <input type='text' v-model='embed.image.url' id='tbImage'></input>
            <label for='tbImage' class='grey-text text-lighten-2'>Image URL</label>
          </div>
          <div class='input-field col s12 m6'>
            <input type='text' v-model='embed.thumbnail.url' id='tbThumbnail'></input>
            <label for='tbThumbnail' class='grey-text text-lighten-2'>Thumbnail URL</label>
          </div>
        </div>
        <h4>Author</h4>
        <div class='row'>
          <div class='input-field col s12 m4'>
            <input type='text' maxlength="256" data-length='256' v-model='embed.author.name' id='tbAuthorName'></input>
            <label for='tbAuthorName' class='grey-text text-lighten-2'>Name</label>
          </div>
          <div class='input-field col s12 m4'>
            <input type='text' v-model='embed.author.url' id='tbAuthorUrl'></input>
            <label for='tbAuthorUrl' class='grey-text text-lighten-2'>URL</label>
          </div>
          <div class='input-field col s12 m4'>
            <input type='text' v-model='embed.author.icon_url' id='tbAuthorIcon'></input>
            <label for='tbAuthorIcon' class='grey-text text-lighten-2'>Icon</label>
          </div>
        </div>
        <h4>Footer</h4>
        <div class='row'>
          <div class='input-field col s12 m6'>
            <input type='text' maxlength="2048" data-length='2048' v-model='embed.footer.text' id='tbFooterText'></input>
            <label for='tbFooterText' class='grey-text text-lighten-2'>Text</label>
          </div>
          <div class='input-field col s12 m6'>
            <input type='text' v-model='embed.footer.icon_url' id='tbFooterIcon'></inputa>
            <label for='tbFooterIcon' class='grey-text text-lighten-2'>Icon</label>
          </div>
        </div>
        <h4>Fields</h4>
        <div class='row'>
          <div class='col s12'>
            <button class='waves-effect waves-light btn full' v-on:click='addField' type='button'>Add</button>
          </div>
          <div class='col s12'>
            <div class='col s12 blue-grey darken-2 field' v-for='(field, i) in embed.fields'>
              <button type='button' v-on:click='removeField(i)' class='red darken-4 waves-effect waves-light btn-floating close-btn'>-</button>              
              <div class='input-field col s12'>
                <input type='text' maxlength='256' data-length='256' v-model='field.name'></input>
                <label class='grey-text text-lighten-2'>Name</label>
              </div>
              <div class='input-field col s12'>
                <textarea maxlength='1024' data-length='1024' type='text' v-model='field.value' class='materialize-textarea'></textarea>
                <label class='grey-text text-lighten-2'>Value</label>
              </div>
            </div>
          </div>
        </div>
      </form>
      <div class='col s12 m6'>
        <discord-embed :source='embed'></discord-embed>
      </div>
    </div>
    <div class='row'>
      <div class='col s12 blue-grey darken-2 bevel'>
        <div class='row button-bar'>
          <div class='col s4'>
            <button class='waves-effect waves-light btn full' v-on:click='copyClipboard'>Copy</button>
          </div>
          <div class='col s4'>
            <button class='waves-effect waves-light btn full' v-on:click='reformat'>Reformat</button>
          </div>
          <div class='col s4'>
            <button class='waves-effect waves-light btn full' v-on:click='exportJson'>Export</button>
          </div>
        </div>
        <textarea class='materialize-textarea grey-text text-lighten-3' ref='hah' v-model='jsoned' id='output' readonly>

        </textarea>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";
import card from "../components/card.vue";
import DiscordEmbed from "../components/embed.vue";

export default {
  data: () => ({
    embed: {
      title: "s",
      description: "",
      url: "",
      color: "#000000",
      footer: {
        text: "",
        icon_url: ""
      },
      author: {
        name: "",
        url: "",
        icon_url: ""
      },
      image: {
        url: ""
      },
      thumbnail: {
        url: ""
      },
      fields: []
    }
  }),
  computed: {
    jsoned() {
      let embed = JSON.parse(JSON.stringify(this.embed));
      let c = embed.color;
      if (c.startsWith("#")) c = c.substring(1);
      embed.color = parseInt(c, 16);
      return JSON.stringify(embed, null, 2);
    },
    jsonedCodeblock() {
      return "```json\n" + this.jsoned + "\n```";
    }
  },
  watch: {
    embed: {
      handler: function(val, oldVal) {
        $("#output").trigger("autoresize");
      },
      deep: true
    }
  },
  methods: {
    addField() {
      this.embed.fields.push({
        name: "",
        value: "",
        inline: false
      });
    },
    removeField(index) {
      this.embed.fields.splice(index, 1);
    },
    validateColor() {
      let c = this.embed.color;
      c = c.replace(/[^a-f0-9]/gi, "").substr(0, 6);
      if (c.length < 6) c = "0".repeat(6 - c.length) + c;
      this.embed.color = "#" + c.toUpperCase();
    },
    exportJson() {
      let arr = this.denyChoices;
      Materialize.toast(arr[Math.floor(Math.random() * arr.length)], 1000);
    },
    reformat() {
      let thing = JSON.parse(this.content);
      if (typeof thing === "string") {
        this.content = thing;
      } else if (thing instanceof Object) {
        if (thing.hasOwnProperty("title") || thing.hasOwnProperty("desc")) {
          this.content = thing.desc || "";
          this.title = thing.title || "";
        } else {
          for (const key in thing) {
            this.content = thing[key].desc;
            this.title = thing[key].title;
            break;
          }
        }
      }
    },
    copyClipboard() {
      console.log(this.$refs.hah);
      this.$refs.hah.select();
      document.execCommand("copy");
      Materialize.toast("Copied!", 1000);
    }
  },
  components: {
    card,
    VueMarkdown,
    DiscordEmbed
  },
  meta: {
    name: "Commands"
  }
};
</script>

<style scoped>
.escape-form {
  border-radius: 10px;
  padding: 5px;
}

#tbContent:not(:focus),
#iTitle:not(:focus) {
  border-bottom-color: #e0e0e0 !important;
}

.button-bar {
  margin: 10px;
}

.bevel {
  border-radius: 10px;
}

input[type="color"] {
  margin: 15px 0 0 0;
  display: block;
}

.field {
  margin: 10px;
  padding: 5px;
  border-radius: 5px;
  box-sizing: border-box;
  position: relative;
}
.close-btn {
  position: absolute;
  right: 5px;
}
</style>