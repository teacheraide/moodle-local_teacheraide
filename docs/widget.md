# Widget Development (WIP)

## Prerequisite

- [volta](https://docs.volta.sh/guide/)

```bash
# inside path/to/moodle/local/teacheraide

cd vue
npm i
npm run dev
```

it should build from `src/main.ts`

the js bundle should be loaded to every page via `\core\hook\output\before_footer_html_generation` hook_callbacks

see https://moodledev.io/docs/4.4/apis/core/hooks
