import { GAS_URL } from "./config.js";
import { logInfo, logError } from "./logger.js";

export async function sendEntry(payload) {
  logInfo("送信データ", payload);

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!data || data.result !== "ok") {
    const message = (data && data.message) || "unknown error";
    logError("送信失敗", message);
    throw new Error(message);
  }

  logInfo("送信成功");
  return data;
}
