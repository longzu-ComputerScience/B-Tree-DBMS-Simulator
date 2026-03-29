"use strict";

const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const running = new Set();

let shuttingDown = false;
let finalExitCode = 0;

function runScript(scriptName) {
  const child = spawn(getCommand(), getArgs(scriptName), {
    cwd: rootDir,
    stdio: "inherit",
    detached: process.platform !== "win32",
  });

  child.scriptName = scriptName;
  running.add(child);

  child.on("error", (error) => {
    console.error(`[dev:all] Failed to start ${scriptName}: ${error.message}`);
    void shutdown(1);
  });

  child.on("exit", (code, signal) => {
    running.delete(child);

    if (shuttingDown) {
      if (running.size === 0) {
        process.exit(finalExitCode);
      }
      return;
    }

    const exitCode = code === null ? 1 : code;
    if (exitCode !== 0 || signal) {
      console.error(
        `[dev:all] ${scriptName} exited ${signal ? `from ${signal}` : `with code ${exitCode}`}.`,
      );
    }

    void shutdown(exitCode);
  });
}

function getCommand() {
  return process.platform === "win32" ? "cmd.exe" : "npm";
}

function getArgs(scriptName) {
  if (process.platform === "win32") {
    return ["/d", "/s", "/c", `npm run ${scriptName}`];
  }

  return ["run", scriptName];
}

function killChild(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve();
      return;
    }

    const done = () => resolve();
    child.once("exit", done);

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });

      killer.on("error", () => {
        try {
          child.kill("SIGTERM");
        } catch {}
        resolve();
      });

      killer.on("exit", () => resolve());
      return;
    }

    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      try {
        child.kill("SIGTERM");
      } catch {}
    }

    setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
      resolve();
    }, 3000).unref();
  });
}

async function shutdown(code) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  finalExitCode = code;

  await Promise.all(Array.from(running, (child) => killChild(child)));
  process.exit(finalExitCode);
}

process.on("SIGINT", () => {
  void shutdown(0);
});

process.on("SIGTERM", () => {
  void shutdown(0);
});

console.log("[dev:all] Starting frontend and backend dev servers...");
runScript("backend:reload");
runScript("dev");
