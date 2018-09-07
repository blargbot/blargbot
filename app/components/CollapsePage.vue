<template>
  <div>
    <div v-if='Object.keys(collapseData).length === 0'>
      <div class='center loading'>
        <h1>Loading...</h1>
      </div>
    </div>
    <div v-else>
        <input type='text' v-model='filter'>

        <div class='button-flex'>
            <button class='button' v-on:click='collapseAll'>Collapse All</button>
            <button class='button' v-on:click='expandAll'>Expand All</button>
        </div>

        <div class='categories'>
            <div class='category' v-for='category in keys' :key='category.name'>
                <div v-if='filtered(category.name).length > 0'>
                    <h2 class='categoryHeader'>{{category.name}}</h2>
                    <p>{{category.desc}}</p>
                    <div class='objects'>
                        <div class='collapsible shadow-1' v-for='obj in filtered(category.name)' :key='obj.key'>
                            <div class='title' v-on:click='clickCollapse'><h3>{{obj.title}}</h3></div>
                            <div class='content'>
                                <vue-markdown :source='obj.message'/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from "vue-markdown";
import Vue from "vue";
import { clearInterval } from "timers";

/* globals window, document, NodeList */

export default {
  data: () => ({
    filter: ""
  }),
  props: ["collapseData"],
  computed: {
    keys() {
      return Object.values(this.collapseData)
        .map(d => ({
          name: d.name,
          desc: d.desc,
          id: d.id
        }))
        .sort((a, b) => a.id - b.id);
    }
  },
  methods: {
    filtered(key) {
      return this.collapseData[key].el.filter(o => {
        return (
          o.keywords.filter(k =>
            (o.category.name.toLowerCase() + "." + k.toLowerCase()).includes(
              this.filter.toLowerCase()
            )
          ).length > 0
        );
      });
    },
    clickCollapse(e) {
      let target = e.target;
      if (target.tagName === "H3") target = target.parentNode.parentNode;
      else if (target.tagName === "DIV" && target.classList.contains("title"))
        target = target.parentNode;
      else if (
        target.tagName === "DIV" &&
        target.classList.contains("collapsible")
      )
        target = target;
      else return;
      this.collapse(target);
    },
    async collapseAll() {
      let els = document.getElementsByClassName("collapsible");
      this.collapse(els, true);
    },
    async expandAll() {
      let els = document.getElementsByClassName("collapsible");
      this.collapse(els, false);
    },
    sleep(time = 1) {
      return new Promise(res => {
        setTimeout(res, time);
      });
    },
    async collapse(els, position) {
      if (els.length === undefined) els = [els];
      let toProcess = [];
      for (const el of els) {
        if (el.classList.contains("locked")) continue;
        let content = el.querySelector(".content");
        let collapsed = el.classList.contains("collapsed");
        if (position !== undefined) {
          if (collapsed === true && position === true) continue;
          if (collapsed === false && position === false) continue;
        }
        el.classList.add("locked");
        toProcess.push({
          content,
          el,
          collapsed,
          inc: content.scrollHeight / 20 * (collapsed ? 1 : -1),
          i: collapsed ? 0 : content.scrollHeight
        });
      }
      for (let ii = 0; ii < 20; ii++) {
        for (const obj of toProcess) {
          let { el, content, collapsed, inc } = obj;
          obj.i += inc;
          content.style.height = obj.i + "px";
        }
        await this.sleep();
      }
      for (const { el, content, collapsed } of toProcess) {
        content.style.height = collapsed ? undefined : 0;
        el.classList.toggle("collapsed");
        el.classList.remove("locked");
      }
    }
  },
  components: {
    VueMarkdown
  },
  created() {
    this.filter = this.$route.params.name;
  }
};
</script>

<style lang='scss' scoped>
.loading {
  padding: 30px;
}

.categories,
.objects {
  display: flex;
  flex-flow: column;
}

.collapsible {
  //   background: rgba(0, 0, 0, 0.1);
  margin: 5px 0;
  border-radius: 3px;

  .title {
    background: rgba(0, 0, 0, 0.2);
    margin: 0;
    padding: 10px;
    cursor: pointer;

    border-radius: 3px 3px 0 0;

    h3 {
      margin: 0;
    }
  }

  .content {
    background: rgba(0, 0, 0, 0.1);
    padding: 0 10px;
    box-sizing: border-box;
    overflow: hidden;
    margin: 0;
    border-radius: 0 0 3px 3px;
  }
}

.button-flex {
  display: flex;

  button {
    flex: 0 1 50%;
  }
}
</style>
