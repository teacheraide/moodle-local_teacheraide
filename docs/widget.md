# Widget Development (WIP)

## Prerequisite

- [volta](https://docs.volta.sh/guide/)

## Start Development

```bash
# inside path/to/moodle/local/teacheraide

cd vue
npm i
npm run dev
```

it should build from the entrypoint `src/main.ts`

then the js entrypoint should be loaded to every page via `\core\hook\output\before_standard_head_html_generation` hook_callbacks

see https://moodledev.io/docs/4.4/apis/core/hooks
