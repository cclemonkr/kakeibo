import { GAS_URL, CATEGORIES, PAYMENTS } from "./config.js";
import { validateEntry } from "./validator.js";
import {
  fillSelect, setTodayDate, showMessage,
  setSubmitting, showSetupWarning, resetAfterSuccess
} from "./ui.js";
import { getFormValues } from "./input.js";
import { sendEntry } from "./spreadsheet.js";
import { logError } from "./logger.js";

const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const paymentSelect = document.getElementById("payment");
const memoInput = document.getElementById("memo");
const todayLabel = document.getElementById("today-label");
const form = document.getElementById("entry-form");
const msgEl = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");
const setupEl = document.getElementById("setup-msg");

fillSelect(categorySelect, CATEGORIES);
fillSelect(paymentSelect, PAYMENTS);
setTodayDate(dateInput, todayLabel);
showSetupWarning(setupEl, GAS_URL);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage(msgEl, "", "");

  const values = getFormValues({ dateInput, amountInput, categorySelect, paymentSelect, memoInput });
  const check = validateEntry(values);

  if (!check.valid) {
    showMessage(msgEl, check.message, "err");
    return;
  }

  if (showSetupWarning(setupEl, GAS_URL)) {
    showMessage(msgEl, "保存先が未設定です（上の案内を確認してください）", "err");
    return;
  }

  setSubmitting(submitBtn, true);
  try {
    await sendEntry(values);
    showMessage(msgEl, "登録しました ✓", "ok");
    resetAfterSuccess(amountInput, memoInput);
  } catch (err) {
    logError(err);
    showMessage(msgEl, "登録に失敗しました（" + err.message + "）", "err");
  } finally {
    setSubmitting(submitBtn, false);
  }
});