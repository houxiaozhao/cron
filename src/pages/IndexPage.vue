<template>
  <q-page class="flex flex-center column q-pa-md">
    <div class="row justify-end self-stretch q-gutter-x-md">
      <q-select
        v-model="currentLanguage"
        :options="languageOptions"
        :label="$t('message.language')"
        outlined
        dense
        emit-value
        map-options
        options-dense
        style="width: 150px"
      />

      <q-select
        v-model="currentFormat"
        :options="formatOptions"
        :label="$t('message.format')"
        outlined
        dense
        emit-value
        map-options
        options-dense
        style="width: 150px"
      />
    </div>

    <div class="text-center q-mb-xl">
      <h1 class="text-h3 q-mb-md">{{ $t("message.title") }}</h1>
      <p class="text-body1 q-mb-lg">{{ $t("message.description") }}</p>
    </div>

    <div class="q-mb-md self-stretch">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle1">{{ $t("message.currentExpression") }}:</div>
        <q-space />
        <q-btn
          flat
          color="primary"
          :label="$t('message.copy')"
          @click="copyExpression"
          icon="content_copy"
        />
      </div>
      <q-input outlined v-model="cron" readonly class="full-width">
        <template #append></template>
      </q-input>
    </div>

    <CronQuasar
      v-model="cron"
      :locale="currentLocale"
      :key="currentLocale + currentFormat"
      :format="currentFormat"
      @update:model-value="updateNextExecutions"
    />

    <div
      v-if="cronDescription || nextExecutions.length > 0"
      class="self-stretch q-mt-lg"
    >
      <q-card flat bordered>
        <q-card-section>
          <div v-if="cronDescription" class="text-subtitle1 q-mb-md">
            <div class="text-weight-medium q-mb-sm">
              {{ $t("message.cronDescription") }}:
            </div>
            <div>{{ cronDescription }}</div>
          </div>
          <div v-if="nextExecutions.length > 0">
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              {{ $t("message.nextExecutions") }}:
            </div>
            <q-list dense>
              <q-item v-for="(time, index) in nextExecutions" :key="index">
                <q-item-section>
                  {{ formatDateTime(time) }}
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { CronQuasar } from "@vue-js-cron/quasar";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import parser from "cron-parser";
import cronstrue from "cronstrue/i18n";

export default defineComponent({
  name: "IndexPage",
  components: { CronQuasar },
  setup() {
    const i18n = useI18n();
    const $q = useQuasar();
    return { i18n, $q };
  },
  data() {
    return {
      cron: "",
      currentLocale: "zh",
      currentLanguage: "zh-CN",
      currentFormat: "crontab",
      // 支持的语言配置
      supportedLanguages: {
        zh: "zh-CN",
        "zh-CN": "zh-CN",
        "zh-TW": "zh-CN",
        "zh-HK": "zh-CN",
        en: "en-US",
        "en-US": "en-US",
        "en-GB": "en-US",
      },
      languageOptions: [
        { label: "中文", value: "zh-CN" },
        { label: "English", value: "en-US" },
      ],
      formatOptions: [
        { label: "Crontab", value: "crontab" },
        { label: "Quartz", value: "quartz" },
        { label: "Spring", value: "spring" },
      ],
      defaultCronValues: {
        crontab: "* * * * *",
        quartz: "* * * * * ?",
        spring: "0 * * * * *",
      },
      nextExecutions: [],
      cronDescription: "",
    };
  },
  watch: {
    currentLanguage(newLang) {
      this.changeLanguage(newLang);
    },
    currentFormat(newFormat) {
      this.changeCronFormat(newFormat);
    },
  },
  methods: {
    detectLanguage() {
      // 获取浏览器语言设置
      const browserLangs = navigator.languages || [
        navigator.language || navigator.userLanguage,
      ];

      // 遍历浏览器语言列表，查找第一个支持的语言
      for (const lang of browserLangs) {
        const normalizedLang = lang.toLowerCase();
        // 检查完整匹配
        if (this.supportedLanguages[lang]) {
          return this.supportedLanguages[lang];
        }
        // 检查语言代码匹配（不包含地区）
        const langCode = normalizedLang.split("-")[0];
        if (this.supportedLanguages[langCode]) {
          return this.supportedLanguages[langCode];
        }
      }

      // 默认返回中文
      return "zh-CN";
    },
    changeLanguage(lang) {
      this.i18n.locale.value = lang;
      this.currentLocale = lang === "zh-CN" ? "zh" : "en";
      localStorage.setItem("language", lang);
      // 更新 cron 描述的语言
      this.updateNextExecutions();
    },
    changeCronFormat(format) {
      localStorage.setItem("cronFormat", format);
      // 重置为对应格式的默认值
      this.cron = this.defaultCronValues[format];
      this.updateNextExecutions();
    },
    async copyExpression() {
      try {
        await navigator.clipboard.writeText(this.cron);
        this.$q.notify({
          message: this.i18n.t("message.copySuccess"),
          color: "positive",
          icon: "check",
        });
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    },
    updateNextExecutions() {
      this.nextExecutions = [];
      this.cronDescription = "";

      try {
        if (!this.cron) {
          return;
        }
        // 获取 cron 表达式的可读描述
        this.cronDescription = cronstrue.toString(this.cron, {
          locale: this.currentLocale === "zh" ? "zh_CN" : "en",
          use24HourTimeFormat: true,
        });

        // 计算未来10次执行时间
        const interval = parser.parseExpression(this.cron);
        for (let i = 0; i < 10; i++) {
          this.nextExecutions.push(interval.next().toDate());
        }
      } catch (err) {
        console.error("Invalid cron expression:", err);
        this.$q.notify({
          message: this.i18n.t("message.invalidCron"),
          color: "negative",
        });
      }
    },
    formatDateTime(date) {
      return new Intl.DateTimeFormat(this.currentLanguage, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date);
    },
  },
  mounted() {
    // 首先检查是否有保存的语言设置
    const savedLang = localStorage.getItem("language");
    // 如果没有保存的语言设置，则使用浏览器语言
    const initialLang = savedLang || this.detectLanguage();

    const savedFormat = localStorage.getItem("cronFormat") || "crontab";
    this.currentLanguage = initialLang;
    this.currentFormat = savedFormat;
    this.changeLanguage(initialLang);
    // 设置初始 cron 值
    this.cron = this.defaultCronValues[savedFormat];
    this.updateNextExecutions();
  },
});
</script>

<style scoped>
.q-page {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}
</style>
