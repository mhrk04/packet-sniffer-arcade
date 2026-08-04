# 🛡️ Packet Sniffer Arcade

> ⚡ **Built in 30 minutes** during the **[Cloudflare Developer Connect x DevOps Malaysia](https://luma.com/devmalaysia-cloudflare?tk=lsekfR)** event!

A sleek, high-contrast, real-time interactive game designed to test your cyber-defense packet analysis skills under pressure. Analyze incoming network traffic and classify packets as **Normal**, **Port Scan**, or **DDoS** before time runs out!

---

## 🚀 Features

- **⚡ Low-Latency State Management:** Powered by **Cloudflare Durable Objects** and **WebSockets** for real-time scoring, timer sync, and rapid traffic delivery.
- **📟 Realistic TCPDUMP Output:** Decipher actual network packet headers containing IP addresses, sequence numbers, payload lengths, and TCP flags (`SYN`, `ACK`, `PSH`, `FIN`).
- **🕹️ Arcade Dashboard UI:** Cyberpunk dark mode aesthetic built with **React**, **Tailwind CSS**, and **Framer Motion**.
- **⏱️ Fast-Paced Gameplay:** 20-second rush mode with full **Pause**, **Resume**, and **Reset** state controls.

---

## 🛠️ Tech Stack

- **Serverless Backend:** [Cloudflare Workers](https://workers.cloudflare.com/) + [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- **Communication:** WebSockets (`ws` / `wss`)
- **Frontend:** React 18 + Tailwind CSS + Framer Motion + Lucide Icons

---

## 💻 Local Development

### Prerequisites
Make sure you have Node.js and `npm` installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
Start the local Cloudflare Workers emulator with Wrangler:
```bash
npx wrangler dev
```

Open your browser and navigate to:
```
http://localhost:8787
```

---

## 📜 License

MIT License. Developed for **Cloudflare Developer Connect x DevOps Malaysia**.
