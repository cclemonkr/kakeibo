// 家計簿 API（Google Apps Script）― スプレッドシートにバインドして使用
const TOKEN = '';            // 合言葉（任意）。使うなら index.html の TOKEN と同じ値に
const SHEET_NAME = '家計簿';  // 無ければ先頭のシートを使用
const HEAD = ['ID','登録日時','利用日','金額','分類','支払方法','メモ','区分'];
const TZ = () => SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

function doGet(e) { return run_(() => { if (TOKEN && e.parameter.token !== TOKEN) throw Error('合言葉が違います'); return list_(); }); }
function doPost(e) {
  return run_(() => {
    const b = JSON.parse(e.postData.contents);
    if (TOKEN && b.token !== TOKEN) throw Error('合言葉が違います');
    if (b.action === 'batch') batch_(b.ops || []);
    return list_();
  });
}
function run_(f) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); return out_(Object.assign({ result: 'ok' }, f())); }
  catch (err) { return out_({ result: 'error', message: String(err.message || err) }); }
  finally { try { lock.releaseLock(); } catch (x) {} }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const h = sh.getRange(1, 1, 1, 8).getValues()[0];
  HEAD.forEach((t, i) => { if (!h[i]) sh.getRange(1, i + 1).setValue(t); });
  return sh;
}
function fmt_(v, t) { return v instanceof Date ? Utilities.formatDate(v, TZ(), t ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd') : String(v || '').replace(/\//g, '-'); }
function list_() {
  const sh = sheet_(), P = PropertiesService.getScriptProperties(), n = sh.getLastRow() - 1, es = [];
  if (n > 0) {
    const v = sh.getRange(2, 1, n, 8).getValues(); let fix = false;
    v.forEach(r => { if (!r[0] && (r[2] || r[3])) { r[0] = Utilities.getUuid(); fix = true; } }); // ID未付与の行に自動採番
    if (fix) sh.getRange(2, 1, n, 1).setNumberFormat('@').setValues(v.map(r => [r[0]]));
    v.forEach(r => { if (r[0]) es.push({ id: String(r[0]), createdAt: fmt_(r[1], true), date: fmt_(r[2]), amount: Number(r[3]) || 0,
      category: String(r[4]), payment: String(r[5]), memo: String(r[6]), type: r[7] === '収入' ? 'income' : 'expense' }); });
  }
  return { entries: es, budget: Number(P.getProperty('budget')) || 0, savings: Number(P.getProperty('savings')) || 0, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() };
}
function clean_(e) {
  if (!e) return null;
  const id = String(e.id || '').slice(0, 64), d = String(e.date || ''), a = Math.round(Number(e.amount));
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(d) || !(a > 0) || a >= 1e10) return null;
  return { id, date: d, amount: a, type: e.type === 'income' ? 'income' : 'expense', category: String(e.category || '').slice(0, 40),
    payment: String(e.payment || '').slice(0, 20), memo: String(e.memo || '').slice(0, 200), createdAt: e.createdAt || '' };
}
const typ_ = e => e.type === 'income' ? '収入' : '支出';
const day_ = s => Utilities.parseDate(s, TZ(), 'yyyy-MM-dd');
const dt_ = s => { try { return Utilities.parseDate(s, TZ(), 'yyyy-MM-dd HH:mm:ss'); } catch (x) { return new Date(); } };
function append_(sh, list) {
  if (!list.length) return;
  const rows = list.map(e => [e.id, e.createdAt ? dt_(e.createdAt) : new Date(), day_(e.date), e.amount, e.category, e.payment, e.memo, typ_(e)]);
  const rg = sh.getRange(sh.getLastRow() + 1, 1, rows.length, 8);
  rg.setNumberFormats(rows.map(() => ['@', 'yyyy/MM/dd HH:mm:ss', 'yyyy/MM/dd', '0', '@', '@', '@', '@'])); rg.setValues(rows);
}
function ids_(sh) { const n = sh.getLastRow() - 1; return n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : []; }
function batch_(ops) {
  const sh = sheet_(), P = PropertiesService.getScriptProperties(); let fin = {};
  const goals = o => P.setProperties({ budget: String(Math.max(0, +o.budget || 0)), savings: String(Math.max(0, +o.savings || 0)) });
  ops.forEach(o => {
    if (o.op === 'upsert') { const e = clean_(o.entry); if (e) fin[e.id] = e; }
    else if (o.op === 'delete') (o.ids || []).forEach(i => fin[String(i)] = null);
    else if (o.op === 'settings') goals(o);
    else if (o.op === 'replaceAll') { // 復元：全件入れ替え
      if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
      append_(sh, (o.entries || []).map(clean_).filter(Boolean)); goals(o); fin = {};
    }
  });
  const del = []; ids_(sh).forEach((id, i) => { if (id in fin && fin[id] === null) del.push(i + 2); });
  for (let i = del.length - 1; i >= 0;) { let j = i; while (j > 0 && del[j - 1] === del[j] - 1) j--; sh.deleteRows(del[j], i - j + 1); i = j - 1; }
  const cur = ids_(sh), add = [];
  Object.keys(fin).forEach(id => {
    const e = fin[id]; if (!e) return; const i = cur.indexOf(id);
    if (i < 0) return add.push(e);
    const rg = sh.getRange(i + 2, 3, 1, 6);
    rg.setNumberFormats([['yyyy/MM/dd', '0', '@', '@', '@', '@']]); rg.setValues([[day_(e.date), e.amount, e.category, e.payment, e.memo, typ_(e)]]);
  });
  append_(sh, add);
}
