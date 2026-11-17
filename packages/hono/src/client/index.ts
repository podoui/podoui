// podo-ui/hono/client — Hono SSR 페이지에 한 번 싣는 정적 스크립트(계획 D8).
// <script defer src="/…/podo-ui/hono/client.js"></script>
import { configure, mount } from "./bridge.js";
import { toast } from "./components.js";
import { installAutofocus } from "./autofocus.js";
import { installDelegation, syncStaticState } from "./events.js";

declare const __PODO_CLIENT_VERSION__: string | undefined;

interface PodoClient {
  installed: true;
  version: string;
  configure: typeof configure;
  mount: (root?: ParentNode) => void;
}

interface PodoGlobal {
  client?: PodoClient;
  toast?: typeof toast;
  [key: string]: unknown;
}

const global = globalThis as typeof globalThis & { podo?: PodoGlobal };
const podo = (global.podo = global.podo || {});

// 중복 로드는 마운트·리스너·podo:ready 모두 생략(no-op).
if (!podo.client?.installed) {
  const mountAll = (root: ParentNode = document) => {
    mount(root);
    syncStaticState(root);
  };
  podo.client = {
    installed: true,
    version: typeof __PODO_CLIENT_VERSION__ === "string" ? __PODO_CLIENT_VERSION__ : "dev",
    configure,
    mount: mountAll,
  };
  // Toaster island와 같은 번들의 React toast 스토어 — 같은 함수예요(계획 D7).
  podo.toast = toast;
  installDelegation(document);
  installAutofocus(document);
  const start = () => {
    mountAll(document);
    document.dispatchEvent(new CustomEvent("podo:ready", { detail: { entry: "client" } }));
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
