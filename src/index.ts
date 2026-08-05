import { DurableObject } from "cloudflare:workers";

interface Env {
  GAME_STATE: DurableObjectNamespace;
}



export class GameState extends DurableObject {
  state: DurableObjectState;
  score: number = 0;
  timeLeft: number = 40;
  isPlaying: boolean = false;
  isPaused: boolean = false;
  currentTraffic: any = null;
  packetIndex: number = 0;
  clients: Set<WebSocket> = new Set();
  timer: any = null;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
  }

  async fetch(request: Request) {
    // Expect upgrade request
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();

    this.clients.add(server);
    server.accept();

    server.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "START") {
          this.startGame();
        } else if (msg.type === "PAUSE") {
          this.pauseGame();
        } else if (msg.type === "RESUME") {
          this.resumeGame();
        } else if (msg.type === "RESET") {
          this.resetGame();
        } else if (msg.type === "GUESS") {
          this.handleGuess(msg.guess, server);
        }
      } catch (err) {
        console.error("Failed to parse message", err);
      }
    });

    server.addEventListener("close", () => {
      this.clients.delete(server);
    });
    
    server.addEventListener("error", () => {
      this.clients.delete(server);
    });

    // Send initial state
    server.send(JSON.stringify({
      type: "STATE",
      data: {
        score: this.score,
        timeLeft: this.timeLeft,
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentTraffic: this.currentTraffic
      }
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  startGame() {
    this.score = 0;
    this.timeLeft = 40;
    this.isPlaying = true;
    this.isPaused = false;
    this.packetIndex = 0;
    this.setNextTraffic();
    this.startTimer();
    this.broadcastState();
  }

  resetGame() {
    this.score = 0;
    this.timeLeft = 40;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTraffic = null;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.broadcastState();
  }

  pauseGame() {
    this.isPlaying = false;
    this.isPaused = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.broadcastState();
  }

  resumeGame() {
    if (this.timeLeft > 0) {
      this.isPlaying = true;
      this.isPaused = false;
      this.startTimer();
      this.broadcastState();
    }
  }

  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.isPlaying = false;
        this.isPaused = false;
        clearInterval(this.timer);
        this.timer = null;
      }
      this.broadcastState();
    }, 1000);
  }

  handleGuess(guess: string, client: WebSocket) {
    if (!this.isPlaying || !this.currentTraffic) return;

    if (guess === this.currentTraffic.type) {
      this.score += 100;
      client.send(JSON.stringify({ type: "FEEDBACK", correct: true }));
    } else {
      client.send(JSON.stringify({ type: "FEEDBACK", correct: false }));
    }

    this.setNextTraffic();
    this.broadcastState();
  }

  setNextTraffic() {
    this.packetIndex++;
    this.currentTraffic = { 
      ...this.getRandomTraffic(), 
      instanceId: this.packetIndex 
    };
  }

  getRandomTraffic() {
    const types = ["Normal", "Port Scan", "DDoS"];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const randomIp = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    let src = randomIp();
    let dest = randomIp();
    let behavior = "";
    let flag = "";
    
    let time = new Date().toISOString().split('T')[1].replace('Z', '');
    let seq = Math.floor(Math.random() * 4294967295);
    let win = 65535;
    let length = Math.floor(Math.random() * 1500);
    let rawString = "";

    if (type === "Normal") {
      const behaviors = ["GET /index.html", "POST /api/login", "GET /assets/style.css", "DNS Query A record", "TLS v1.3 Client Hello"];
      const flags = ["ACK", "PSH, ACK", "SYN, ACK", "FIN, ACK"];
      behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      flag = flags[Math.floor(Math.random() * flags.length)];
      rawString = `${time} IP ${src}.${Math.floor(Math.random() * 60000 + 1024)} > ${dest}.443: Flags [${flag.charAt(0)}.], seq ${seq}:${seq+length}, ack 1, win ${win}, length ${length}`;
    } else if (type === "Port Scan") {
      const ports = ["21, 22, 23, 25, 80", "135, 139, 445", "8080, 8443, 8000", "1-1024", "3306, 5432, 27017"];
      const portString = ports[Math.floor(Math.random() * ports.length)];
      behavior = `Sequential SYNs to ports ${portString}`;
      flag = "SYN";
      rawString = `${time} IP ${src}.${Math.floor(Math.random() * 60000 + 1024)} > ${dest}.${portString.split(',')[0]}: Flags [S], seq ${seq}, win 1024, length 0`;
    } else {
      src = "Botnet Cluster";
      const attacks = ["1GB/s traffic spike, UDP fragment flood", "TCP SYN Flood, 500k pps", "HTTP GET Flood via Proxy", "ICMP Ping Flood (Smurf)", "DNS Amplification Attack"];
      const flags = ["None", "SYN", "UDP", "ICMP"];
      behavior = attacks[Math.floor(Math.random() * attacks.length)];
      flag = flags[Math.floor(Math.random() * flags.length)];
      
      let ipSrc = randomIp();
      if (flag === "UDP") {
        rawString = `${time} IP ${ipSrc}.${Math.floor(Math.random() * 60000 + 1024)} > ${dest}.${Math.floor(Math.random() * 60000 + 1024)}: UDP, length 1472 (frag ${Math.floor(Math.random() * 50000)}:1472@0+)`;
      } else if (flag === "SYN") {
        rawString = `${time} IP ${ipSrc}.${Math.floor(Math.random() * 60000 + 1024)} > ${dest}.80: Flags [S], seq ${seq}, win 1024, length 0`;
      } else {
        rawString = `${time} IP ${ipSrc} > ${dest}: ICMP echo request, id 1, seq ${seq}, length 64`;
      }
    }

    return { type, src, dest, behavior, flag, rawString };
  }

  broadcastState() {
    const stateMsg = JSON.stringify({
      type: "STATE",
      data: {
        score: this.score,
        timeLeft: this.timeLeft,
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentTraffic: this.currentTraffic
      }
    });

    for (const client of this.clients) {
      try {
        client.send(stateMsg);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/ws")) {
      const id = env.GAME_STATE.idFromName("global");
      const stub = env.GAME_STATE.get(id);
      return stub.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  }
}
