/**
 * The WhatsApp simulator UI, served at GET /demo. Self-contained HTML —
 * no build step, no framework — styled to feel like WhatsApp so playing
 * with the flows feels like the real thing. All API calls carry the
 * internal token (asked for once, kept in localStorage).
 */
export const DEMO_PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sold Direct — WhatsApp demo</title>
<style>
  :root {
    --wa-header: #075E54; --wa-accent: #25D366; --wa-wall: #ECE5DD;
    --wa-out: #DCF8C6; --wa-in: #FFFFFF; --ink: #111B21; --muted: #667781;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
         background: #d1d7db; color: var(--ink); }
  .phone { max-width: 460px; margin: 0 auto; height: 100dvh;
           display: flex; flex-direction: column; background: var(--wa-wall);
           box-shadow: 0 0 24px rgba(0,0,0,.25); }

  header { background: var(--wa-header); color: #fff; padding: 10px 14px;
           display: flex; align-items: center; gap: 10px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--wa-accent);
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 15px; color: #fff; flex: none; }
  .title { flex: 1; min-width: 0; }
  .title b { display: block; font-size: 15px; }
  .title span { font-size: 12px; opacity: .8; display: block;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  header button { background: rgba(255,255,255,.15); color: #fff; border: 0;
                  border-radius: 8px; padding: 7px 10px; font-size: 12px;
                  cursor: pointer; }

  .banner { background: #FDF3D7; color: #54471f; font-size: 11.5px;
            padding: 6px 12px; text-align: center; }

  #chat { flex: 1; overflow-y: auto; padding: 14px 10px;
          background-image: radial-gradient(#00000008 1px, transparent 1px);
          background-size: 22px 22px; }
  .row { display: flex; margin-bottom: 6px; }
  .row.me { justify-content: flex-end; }
  .bubble { max-width: 82%; padding: 7px 10px 5px; border-radius: 8px;
            font-size: 14px; line-height: 1.35; white-space: pre-wrap;
            word-break: break-word; box-shadow: 0 1px 1px rgba(0,0,0,.08); }
  .me .bubble { background: var(--wa-out); border-top-right-radius: 2px; }
  .them .bubble { background: var(--wa-in); border-top-left-radius: 2px; }
  .meta { font-size: 10.5px; color: var(--muted); text-align: right; margin-top: 3px; }
  .me .meta::after { content: " ✓✓"; color: #53BDEB; }

  .draft { background: #FFF8E6; border: 1px dashed #E5B94E; border-radius: 10px;
           padding: 10px 12px; margin: 4px 0 10px; max-width: 92%; }
  .draft .tag { font-size: 10.5px; font-weight: 700; letter-spacing: .06em;
                color: #9a7b1c; text-transform: uppercase; }
  .draft .text { font-size: 13.5px; margin: 6px 0; white-space: pre-wrap; }
  .draft .tools { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .draft .esc { color: #C0392B; font-weight: 600; }
  .draft button { border: 0; border-radius: 7px; padding: 6px 12px;
                  font-size: 12.5px; cursor: pointer; margin-right: 6px; }
  .draft .ok { background: var(--wa-accent); color: #fff; }
  .draft .no { background: #eee; }

  .typing { display: none; font-size: 12px; color: var(--muted); padding: 0 12px 6px; }
  .typing.on { display: block; }

  .chips { display: flex; gap: 6px; overflow-x: auto; padding: 6px 10px;
           background: #f6f5f3; }
  .chips button { flex: none; border: 1px solid #d7d3cc; background: #fff;
                  border-radius: 999px; padding: 6px 12px; font-size: 12.5px;
                  cursor: pointer; color: var(--ink); }

  .composer { display: flex; gap: 8px; padding: 8px 10px; background: #f0f0f0; }
  .composer input { flex: 1; border: 0; border-radius: 999px; padding: 11px 16px;
                    font-size: 14px; outline: none; }
  .composer button { width: 44px; height: 44px; border-radius: 50%; border: 0;
                     background: var(--wa-header); color: #fff; font-size: 17px;
                     cursor: pointer; flex: none; }

  dialog { border: 0; border-radius: 12px; padding: 22px; max-width: 340px; width: 90%; }
  dialog::backdrop { background: rgba(0,0,0,.45); }
  dialog h3 { margin-bottom: 8px; font-size: 16px; }
  dialog p { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
  dialog input { width: 100%; padding: 10px 12px; font-size: 14px;
                 border: 1px solid #ccc; border-radius: 8px; margin-bottom: 12px; }
  dialog button { background: var(--wa-header); color: #fff; border: 0;
                  border-radius: 8px; padding: 10px 16px; font-size: 14px; cursor: pointer; }
</style>
</head>
<body>
<div class="phone">
  <header>
    <div class="avatar">SD</div>
    <div class="title">
      <b>Sold Direct</b>
      <span id="sub">simulator · you are <span id="mynum"></span></span>
    </div>
    <button id="newchat" title="Start a fresh conversation as a new person">New chat</button>
  </header>
  <div class="banner">Demo — the real production brain (flows, database, AI concierge). Only the WhatsApp transport is simulated.</div>
  <div id="chat"></div>
  <div class="typing" id="typing">Sold Direct is typing…</div>
  <div class="chips" id="chips"></div>
  <div class="composer">
    <input id="box" placeholder="Type a message" autocomplete="off">
    <button id="send">➤</button>
  </div>
</div>

<dialog id="tokendlg">
  <h3>Internal token</h3>
  <p>Paste the INTERNAL_API_TOKEN from your Railway variables. It stays in this browser only.</p>
  <input id="tokenbox" placeholder="internal token" type="password">
  <button id="tokensave">Save</button>
</dialog>

<script>
(function () {
  var LS_TOKEN = 'sd_demo_token', LS_PHONE = 'sd_demo_phone';
  var chat = document.getElementById('chat');
  var typing = document.getElementById('typing');
  var box = document.getElementById('box');
  var dlg = document.getElementById('tokendlg');
  var phone = localStorage.getItem(LS_PHONE) || newPhone();
  var pollTimer = null;

  function newPhone() {
    var n = '+2700' + String(Math.floor(Math.random() * 1e7)).padStart(7, '0');
    localStorage.setItem(LS_PHONE, n);
    return n;
  }
  function token() { return localStorage.getItem(LS_TOKEN) || ''; }
  function askToken() { dlg.showModal(); }

  document.getElementById('mynum').textContent = phone;
  document.getElementById('tokensave').onclick = function () {
    var v = document.getElementById('tokenbox').value.trim();
    if (!v) return;
    localStorage.setItem(LS_TOKEN, v);
    dlg.close();
    refresh();
  };
  document.getElementById('newchat').onclick = function () {
    phone = newPhone();
    document.getElementById('mynum').textContent = phone;
    chat.innerHTML = '';
    refresh();
  };

  var CHIPS = [
    'list',
    'How long does a transfer usually take?',
    'What 2-beds are for sale in Sea Point?',
    'I have a R150k deposit on a R1.5m home — first-time buyer. Am I ok?',
    'Should I accept an offer below asking?'
  ];
  var chips = document.getElementById('chips');
  CHIPS.forEach(function (c) {
    var b = document.createElement('button');
    b.textContent = c;
    b.onclick = function () { box.value = c; send(); };
    chips.appendChild(b);
  });

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { 'content-type': 'application/json', 'x-internal-token': token() },
      opts.headers || {});
    return fetch(path, opts).then(function (r) {
      if (r.status === 401) { askToken(); throw new Error('unauthorized'); }
      return r.json();
    });
  }

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function time(d) {
    d = new Date(d);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function render(state) {
    var html = '';
    state.messages.forEach(function (m) {
      var me = m.direction === 'inbound'; // you play the customer
      html += '<div class="row ' + (me ? 'me' : 'them') + '"><div class="bubble">'
        + esc(m.body)
        + '<div class="meta">' + time(m.createdAt) + '</div></div></div>';
    });
    state.drafts.forEach(function (d) {
      html += '<div class="row them"><div class="draft">'
        + '<span class="tag">🤖 AI draft — awaiting your approval (shadow mode)</span>'
        + (d.escalated ? '<div class="tools esc">⚑ flagged for concierge takeover</div>' : '')
        + '<div class="text">' + esc(d.draft) + '</div>'
        + (d.toolCalls && d.toolCalls.length
            ? '<div class="tools">tools used: ' + esc(d.toolCalls.join(', ')) + '</div>' : '')
        + '<button class="ok" data-id="' + d.id + '" data-act="approve">Approve &amp; send</button>'
        + '<button class="no" data-id="' + d.id + '" data-act="dismiss">Dismiss</button>'
        + '</div></div>';
    });
    chat.innerHTML = html;
    chat.querySelectorAll('.draft button').forEach(function (b) {
      b.onclick = function () {
        api('/api/demo/drafts/' + b.dataset.id + '/' + b.dataset.act, {
          method: 'POST', body: '{}'
        }).then(render).catch(function () {});
      };
    });
    chat.scrollTop = chat.scrollHeight;
  }

  function refresh() {
    if (!token()) { askToken(); return; }
    api('/api/demo/conversation?phone=' + encodeURIComponent(phone))
      .then(render).catch(function () {});
  }

  function send() {
    var text = box.value.trim();
    if (!text) return;
    if (!token()) { askToken(); return; }
    box.value = '';
    // optimistic echo
    var row = document.createElement('div');
    row.className = 'row me';
    row.innerHTML = '<div class="bubble">' + esc(text) + '<div class="meta">…</div></div>';
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    typing.classList.add('on');
    api('/api/demo/messages', {
      method: 'POST',
      body: JSON.stringify({ phone: phone, text: text })
    }).then(function (state) {
      typing.classList.remove('on');
      render(state);
    }).catch(function () { typing.classList.remove('on'); });
  }

  document.getElementById('send').onclick = send;
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

  // Gentle poll so shadow drafts / async work show up without a reload.
  pollTimer = setInterval(function () {
    if (token() && !typing.classList.contains('on')) refresh();
  }, 4000);

  refresh();
})();
</script>
</body>
</html>`;
