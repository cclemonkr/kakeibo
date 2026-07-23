export function fillSelect(el, items) {
  el.innerHTML = items
    .map(([name, icon]) => `<option value="${name}">${icon} ${name}</option>`)
    .join("");
}

export function setTodayDate(dateInput, todayLabel) {
  const iso = new Date().toISOString().slice(0, 10);
  dateInput.value = iso;
  if (todayLabel) todayLabel.textContent = iso.replace(/-/g, "/");
}

export function showMessage(msgEl, text, type) {
  msgEl.textContent = text;
  msgEl.className = "msg" + (type ? " " + type : "");
}

export function setSubmitting(btn, isSubmitting) {
  btn.disabled = isSubmitting;
  btn.textContent = isSubmitting ? "登録中…" : "登録する";
}

export function showSetupWarning(setupEl, gasUrl) {
  if (gasUrl.indexOf("PASTE_YOUR_GAS_WEBAPP_URL_HERE") !== -1) {
    setupEl.classList.add("show");
    return true;
  }
  return false;
}

export function resetAfterSuccess(amountInput, memoInput) {
  amountInput.value = "";
  memoInput.value = "";
}
