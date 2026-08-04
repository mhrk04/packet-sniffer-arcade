import { DurableObject } from "cloudflare:workers";

export class App extends DurableObject {
  async fetch(request: Request) {
    return new Response("DO_WORKING");
  }
}

export default {
  async fetch(request: Request) {
    return new Response("DEFAULT_WORKER_WORKING");
  }
}
