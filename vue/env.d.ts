/// <reference types="vite/client" />

// eslint-disable-next-line no-var
declare var M: {
  cfg: {
    wwwroot: string;
    sesskey: string;
  };
  teacheraide: {
    openai: AzureOpenAI;
  };
};

declare module "core/ajax" {
  const call: any;
}
