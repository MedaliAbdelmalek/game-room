import { onRequest as __api_kv___path___ts_onRequest } from "C:\\Users\\DALI\\Desktop\\game-room\\functions\\api\\kv\\[[path]].ts"

export const routes = [
    {
      routePath: "/api/kv/:path*",
      mountPath: "/api/kv",
      method: "",
      middlewares: [],
      modules: [__api_kv___path___ts_onRequest],
    },
  ]