// Cliente mínimo de Chrome DevTools Protocol (sin dependencias) para las pruebas E2E con Edge y WebView2.
export async function connect(port, { match = () => true, timeout = 15000 } = {}) {
  const t0 = Date.now();
  let page;
  while (!page) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(p => p.type === 'page' && match(p)); } catch {}
    if (!page) { if (Date.now() - t0 > timeout) throw new Error('No se pudo conectar al navegador'); await sleep(200); }
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
  let id = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise((ok, ko) => {
    const i = ++id; const t = setTimeout(() => { pending.delete(i); ko(new Error(`CDP sin respuesta: ${method}`)); }, 15000);
    pending.set(i, m => { clearTimeout(t); ok(m); }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  await send('Page.enable');
  const evaluate = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error('Error en la página: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result?.result?.value;
  };
  return { send, evaluate, errors, close: () => ws.close() };
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
