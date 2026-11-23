
# SecureSpine++

**100% Local, Privacy-First Ergonomic & Deep-Focus Co-Pilot for Developers**

SecureSpine++ protects your spine without breaking coding flow or compromising privacy. Instead of random pop-up timers that interrupt deep focus, it syncs recovery breaks with natural coding milestones (`git commit`, builds, or 50-minute sitting caps) and verifies physical away-from-desk recovery locally in your browser using WebAssembly pose detection.

## Use It Instantly in Your Browser (Zero Installation)

Open the live web app in Chrome or Edge: **`https://securespine-pp.vercel.app/`**

* **100% On-Device AI:** Webcam pose detection runs locally inside your browser via WebAssembly. **Zero video frames ever leave your device.**
* **Automatic Browser Persistence:** Your deep-focus sprint timer, milestone logs, and verified breaks save automatically in your browser.
* **Meeting Auto-Pause:** Toggle **Meeting Auto-Pause** on anytime you are screen-sharing or on a call.

## Run Locally With Automatic `git commit` Triggers

Want SecureSpine++ to automatically trigger recovery breaks every time you run `git commit` in your terminal? Clone the repository and run the lightweight local companion:

1. **Download & Start the Local SQLite Bridge:**
Run `git clone [https://github.com/meskat880/securespine-pp.git]`, move into `securespine-pp/server`, and run `npm install` followed by `npm start`.
2. **Connect Your Git Repository:**
From the project root, run `node server/install-git-hook.js /path/to/your-repo` to wire up automatic `post-commit` break triggers.
3. **Launch Your Local Dashboard:**
Move into `client/`, run `npm install` and `npm run dev`, and open `http://localhost:5174`.

## Why SecureSpine++?

* **Zero Cloud Uploads:** No accounts, no tracking, and no webcam footage sent to any server.
* **Flow-First Timing:** Only prompts breaks at natural stopping points—never mid-keystroke.
* **Verified Decompression:** Confirms you physically stand up and step away from your desk before unlocking your workspace.
