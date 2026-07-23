export function getFormValues({ dateInput, amountInput, categorySelect, paymentSelect, memoInput }) {
  return {
    date: dateInput.value,
    amount: amountInput.value ? Number(amountInput.value) : null,
    category: categorySelect.value,
    payment: paymentSelect.value,
    memo: memoInput.value
  };
}
