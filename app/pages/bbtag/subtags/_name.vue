<template>
    <div>
        <section>
            <h1 class='center'>SubTags</h1>
        </section>
        <section>
            <collapse-page :collapseData='data'/>
        </section>
    </div>
</template>

<script>
import CollapsePage from "~/components/CollapsePage.vue";

export default {
  components: { CollapsePage },
  async asyncData({ app }) {
    let retObj = {};

    let res = await app.$axios.$get("/subtags");
    for (const key in res) {
      res[key].el = res[key].el.map(c => {
        let out = [];
        // console.log(c);
        // out.push(`${c.info}`);

        return {
          key: c.key,
          title: c.name,
          category: { name: res[key].name },
          keywords: [c.name],
          message: out.join("\n")
        };
      });
    }
    retObj.data = res;

    return retObj;
  },
  mounted() {}
};
</script>
