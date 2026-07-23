export function validateEntry({ amount, date, category, payment }) {
  if (!amount || Number(amount) <= 0) {
    return { valid: false, message: "金額を入力してください" };
  }
  if (!date) {
    return { valid: false, message: "利用日を入力してください" };
  }
  if (!category) {
    return { valid: false, message: "分類を選択してください" };
  }
  if (!payment) {
    return { valid: false, message: "支払方法を選択してください" };
  }
  return { valid: true };
}