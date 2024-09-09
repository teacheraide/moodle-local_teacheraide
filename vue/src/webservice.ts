import { call as fetchMany } from "core/ajax";

interface RequestInit {
  endpoint: string;
  method: string;
  params: string;
}

async function fetchThroughlocalTeacheraideOpenAIGateway({
  endpoint,
  method,
  params,
}: RequestInit) {
  return fetchMany([
    {
      methodname: "local_teacheraide_openai_gateway",
      args: {
        endpoint,
        method,
        params,
      },
    },
  ])[0];
}

const wwwroot = M.cfg.wwwroot;

export const webserviceBaseUrl = `${wwwroot}/webservice/restful/server.php/local_teacheraide_openai_gateway`;

export const webserviceFetch: typeof fetch = async (url, init) => {
  const res = await fetchThroughlocalTeacheraideOpenAIGateway({
    endpoint: `${url}`.replace(webserviceBaseUrl, ""), // Remove the base URL from the endpoint
    method: init?.method as string,
    params: init?.body as string, // body is already a string
  });

  return new Response(res.data, {
    // create standard Response object
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
