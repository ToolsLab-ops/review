/* ToolsLab. ネットワーク・ドメイン系ツール（2026-11-25 追加）
   すべてブラウザ内で動作。DNSはCloudflare / GoogleのDNS over HTTPS、
   IP確認はipify、ドメイン情報はrdap.org、証明書はcrt.sh（CTログ）、AS番号はTeam CymruのDNSを利用する。
   tools.js の後に読み込むこと（TOOLS・RENDERERS・SECTION_LABELS・initTool を拡張する）。 */

TOOLS.push(
  { id:'mail-auth',  cat:'network', icon:'✉️', name:'SPF・DKIM・DMARCチェッカー', desc:'メールのなりすまし対策の設定を診断' },
  { id:'dns-lookup', cat:'network', icon:'🔎', name:'DNSレコード検索',            desc:'A・MX・TXT・NSなどを一括取得' },
  { id:'my-ip',      cat:'network', icon:'📍', name:'IPアドレス確認',             desc:'自分のIPv4/IPv6とプロバイダを表示' },
  { id:'ip-info',    cat:'network', icon:'🛰️', name:'IPアドレス情報検索',         desc:'逆引き・AS番号・管理組織を調べる' },
  { id:'subnet',     cat:'network', icon:'🧮', name:'サブネット計算',             desc:'CIDRからアドレス範囲・ホスト数を計算' },
  { id:'whois',      cat:'network', icon:'📇', name:'ドメイン情報検索（Whois）',   desc:'登録日・有効期限・レジストラを確認' },
  { id:'ssl-ct',     cat:'network', icon:'🔒', name:'SSL証明書チェック',          desc:'証明書の発行元・有効期限を確認' },
  { id:'punycode',   cat:'network', icon:'🈁', name:'日本語ドメイン変換',          desc:'日本語ドメイン⇔Punycode（xn--）' }
);
SECTION_LABELS.network = '📡 ネットワーク';

(function () {
  var s = document.createElement('style');
  s.textContent = [
    '.nt-row{display:flex;gap:8px}.nt-row input{flex:1;min-width:0}',
    '.nt-btn{padding:9px 16px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-weight:700;font-family:inherit;font-size:.85rem;cursor:pointer;white-space:nowrap}',
    '.nt-btn:disabled{opacity:.55;cursor:wait}',
    '.nt-out{margin-top:14px;font-size:.84rem;line-height:1.7}',
    '.nt-card{border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:10px;background:var(--white)}',
    '.nt-card h4{margin:0 0 8px;font-size:.92rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.nt-badge{display:inline-block;font-size:.7rem;font-weight:700;padding:2px 9px;border-radius:99px;white-space:nowrap}',
    '.nt-ok{background:#DCFCE7;color:#166534}.nt-warn{background:#FEF3C7;color:#92400E}.nt-ng{background:#FEE2E2;color:#991B1B}.nt-info{background:var(--blue-lt);color:var(--blue-d)}',
    '.nt-code{font-family:monospace;font-size:.78rem;background:var(--bg2);border-radius:6px;padding:6px 8px;word-break:break-all;white-space:pre-wrap;margin:4px 0}',
    '.nt-issues{list-style:none;margin:6px 0 0;padding:0}.nt-issues li{margin:6px 0;display:flex;gap:8px;align-items:flex-start}.nt-issues .nt-badge{margin-top:2px}',
    '.nt-tree{margin:4px 0 0;padding-left:1.1em;font-size:.78rem}.nt-tree li{margin:3px 0;word-break:break-all}',
    '.nt-tblwrap{overflow-x:auto}.nt-tbl{width:100%;border-collapse:collapse;font-size:.8rem}',
    '.nt-tbl th,.nt-tbl td{border-bottom:1px solid var(--border);padding:6px;text-align:left;vertical-align:top;word-break:break-all}',
    '.nt-tbl th{color:var(--muted);font-weight:700;white-space:nowrap;word-break:normal}',
    '.nt-note{font-size:.72rem;color:var(--muted);margin-top:8px;line-height:1.6}',
    '.nt-big{font-family:monospace;font-size:1.25rem;font-weight:900;color:var(--blue);word-break:break-all}',
    '.nt-bin b{color:var(--blue)}'
  ].join('\n');
  document.head.appendChild(s);
})();

/* ── 共通 ── */
function ntEl(id) { return document.getElementById(id); }
function ntVal(id) { var e = ntEl(id); return e ? e.value : ''; }
function ntEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ntBadge(kind, text) { return '<span class="nt-badge nt-' + kind + '">' + ntEsc(text) + '</span>'; }
var NT_LABEL = { ok: 'OK', warn: '注意', ng: '要修正', info: '情報' };
function ntIssues(list) {
  if (!list.length) return '';
  return '<ul class="nt-issues">' + list.map(function (i) { return '<li>' + ntBadge(i[0], NT_LABEL[i[0]]) + '<span>' + i[1] + '</span></li>'; }).join('') + '</ul>';
}
function ntCard(title, badge, body) { return '<div class="nt-card"><h4>' + title + (badge || '') + '</h4>' + body + '</div>'; }
function ntErr(msg) { return ntCard('エラー', ntBadge('ng', '確認できません'), '<div>' + msg + '</div>'); }
function ntLoading(msg) { return '<div class="nt-note">⏳ ' + ntEsc(msg) + '</div>'; }
function ntDate(s) {
  if (!s) return '—';
  var d = new Date(s);
  if (isNaN(d)) return ntEsc(s);
  return d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + '（日本時間）';
}
function ntDaysLeft(s) { return Math.floor((new Date(s) - new Date()) / 86400000); }
function ntCountry(cc) {
  if (!cc) return '';
  try { return new Intl.DisplayNames(['ja'], { type: 'region' }).of(cc.toUpperCase()) + '（' + cc.toUpperCase() + '）'; } catch (e) { return cc; }
}
function ntFetchT(url, opt, ms) {
  var c = new AbortController();
  var t = setTimeout(function () { c.abort(); }, ms || 15000);
  return fetch(url, Object.assign({ signal: c.signal }, opt || {})).finally(function () { clearTimeout(t); });
}

/* ── ドメイン・IPの解釈 ── */
var NT_SLD = ['co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'ad.jp', 'ed.jp', 'go.jp', 'gr.jp', 'lg.jp', 'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.kr', 'com.cn', 'com.tw', 'com.hk', 'com.sg', 'co.nz', 'co.in', 'com.br'];
function ntToAscii(host) {
  try { return new URL('http://' + host).hostname; } catch (e) { return host; }
}
function ntDomain(v) {
  v = (v || '').trim();
  if (!v) return '';
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/^[^@\s\/]*@/, '').split(/[\/?#\s]/)[0];
  v = v.replace(/:\d+$/, '').replace(/\.$/, '').toLowerCase();
  if (/[^\x00-\x7f]/.test(v)) v = ntToAscii(v);
  return v;
}
function ntIsDomain(d) { return /^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(d) && !ntV4(d); }
function ntOrgDomain(d) {
  var l = d.split('.');
  if (l.length <= 2) return d;
  var n = NT_SLD.indexOf(l.slice(-2).join('.')) >= 0 ? 3 : 2;
  return l.slice(-n).join('.');
}
function ntV4(s) {
  var m = String(s).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  var o = m.slice(1).map(Number);
  return o.some(function (x) { return x > 255; }) ? null : o;
}
function ntV6(s) {
  s = String(s).toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  if (!/^[0-9a-f:.]+$/.test(s) || s.indexOf(':') < 0 || s.split('::').length > 2) return null;
  var v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    var o = ntV4(v4[1]);
    if (!o) return null;
    s = s.slice(0, -v4[1].length) + ((o[0] << 8) | o[1]).toString(16) + ':' + ((o[2] << 8) | o[3]).toString(16);
  }
  var parts = s.split('::');
  var h = parts[0] ? parts[0].split(':') : [];
  var t = parts.length > 1 && parts[1] ? parts[1].split(':') : [];
  if (parts.length === 1 && h.length !== 8) return null;
  if (parts.length === 2 && h.length + t.length > 7) return null;
  var fill = parts.length === 2 ? new Array(8 - h.length - t.length).fill('0') : [];
  var g = h.concat(fill, t);
  if (g.length !== 8 || g.some(function (x) { return !/^[0-9a-f]{1,4}$/.test(x); })) return null;
  return g.map(function (x) { return parseInt(x, 16); });
}
function ntV6Str(g) {
  var best = -1, bestLen = 0;
  for (var i = 0; i < 8;) {
    if (g[i] !== 0) { i++; continue; }
    var j = i; while (j < 8 && g[j] === 0) j++;
    if (j - i > bestLen && j - i > 1) { best = i; bestLen = j - i; }
    i = j;
  }
  var hex = g.map(function (x) { return x.toString(16); });
  if (best < 0) return hex.join(':');
  return hex.slice(0, best).join(':') + '::' + hex.slice(best + bestLen).join(':');
}
function ntV6Full(g) { return g.map(function (x) { return ('000' + x.toString(16)).slice(-4); }).join(':'); }
function ntReverseName(ip) {
  var o = ntV4(ip);
  if (o) return o.slice().reverse().join('.') + '.in-addr.arpa';
  var g = ntV6(ip);
  if (g) return ntV6Full(g).replace(/:/g, '').split('').reverse().join('.') + '.ip6.arpa';
  return null;
}
function ntV4Type(o) {
  var n = ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
  var inR = function (a, b, c, d, p) { var base = (((a << 24) >>> 0) + (b << 16) + (c << 8) + d) >>> 0; var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; return ((n & mask) >>> 0) === base; };
  if (inR(10, 0, 0, 0, 8) || inR(172, 16, 0, 0, 12) || inR(192, 168, 0, 0, 16)) return ['private', 'プライベートIPアドレス（社内・家庭内LAN用）'];
  if (inR(100, 64, 0, 0, 10)) return ['private', '共有アドレス（CGNAT：プロバイダ内部用）'];
  if (inR(127, 0, 0, 0, 8)) return ['special', 'ループバック（自分自身）'];
  if (inR(169, 254, 0, 0, 16)) return ['special', 'リンクローカル（DHCPで取得できなかったとき等の自動割り当て）'];
  if (inR(0, 0, 0, 0, 8)) return ['special', '予約済み（このネットワーク）'];
  if (inR(192, 0, 2, 0, 24) || inR(198, 51, 100, 0, 24) || inR(203, 0, 113, 0, 24)) return ['special', 'ドキュメント用（説明・例示専用）'];
  if (inR(198, 18, 0, 0, 15)) return ['special', 'ベンチマーク試験用'];
  if (inR(224, 0, 0, 0, 4)) return ['special', 'マルチキャスト'];
  if (n === 0xFFFFFFFF) return ['special', 'ブロードキャスト'];
  if (inR(240, 0, 0, 0, 4)) return ['special', '予約済み（将来用）'];
  return ['global', 'グローバルIPアドレス（インターネット上で一意）'];
}
function ntV6Type(g) {
  if (g.every(function (x) { return x === 0; })) return ['special', '未指定アドレス（::）'];
  if (g.slice(0, 7).every(function (x) { return x === 0; }) && g[7] === 1) return ['special', 'ループバック（::1）'];
  if (g.slice(0, 5).every(function (x) { return x === 0; }) && g[5] === 0xffff) return ['special', 'IPv4射影アドレス'];
  if ((g[0] & 0xfe00) === 0xfc00) return ['private', 'ユニークローカル（IPv6のプライベートアドレス）'];
  if ((g[0] & 0xffc0) === 0xfe80) return ['special', 'リンクローカル（同じネットワーク内専用）'];
  if ((g[0] & 0xff00) === 0xff00) return ['special', 'マルチキャスト'];
  if (g[0] === 0x2001 && g[1] === 0x0db8) return ['special', 'ドキュメント用（説明・例示専用）'];
  if (g[0] === 0x64 && g[1] === 0xff9b) return ['special', 'NAT64用'];
  if ((g[0] & 0xe000) === 0x2000) return ['global', 'グローバルユニキャスト（インターネット上で一意）'];
  return ['special', '予約済み'];
}

/* ── DNS over HTTPS ── */
var NT_TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257 };
var NT_TYPENAME = {}; Object.keys(NT_TYPES).forEach(function (k) { NT_TYPENAME[NT_TYPES[k]] = k; });
async function ntDns(name, type, resolver) {
  var r = resolver || 'cloudflare';
  var url = r === 'google'
    ? 'https://dns.google/resolve?name=' + encodeURIComponent(name) + '&type=' + type
    : 'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(name) + '&type=' + type;
  var res;
  try { res = await ntFetchT(url, r === 'google' ? {} : { headers: { accept: 'application/dns-json' } }, 10000); }
  catch (e) { if (!resolver) return ntDns(name, type, 'google'); throw new Error('DNSサービスに接続できませんでした。通信環境を確認して再実行してください。'); }
  if (!res.ok) { if (!resolver) return ntDns(name, type, 'google'); throw new Error('DNSサービスがエラーを返しました（HTTP ' + res.status + '）。'); }
  var j = await res.json();
  var want = NT_TYPES[type];
  var all = j.Answer || [];
  return { status: j.Status, ad: !!j.AD, all: all, answers: all.filter(function (a) { return a.type === want; }) };
}
function ntTxt(data) {
  var m = String(data).match(/"((?:[^"\\]|\\.)*)"/g);
  if (!m) return data;
  return m.map(function (s) { return s.slice(1, -1).replace(/\\(\d{3})/g, function (_, d) { return String.fromCharCode(+d); }).replace(/\\(.)/g, '$1'); }).join('');
}
var NT_RCODE = { 1: 'FORMERR（問い合わせの形式エラー）', 2: 'SERVFAIL（DNSサーバーが応答できませんでした。ネームサーバーの停止やDNSSECの設定誤りの可能性）', 3: 'NXDOMAIN（このドメイン名は存在しません）', 5: 'REFUSED（問い合わせを拒否されました）' };

/* ════ 1. SPF・DKIM・DMARCチェッカー ════ */
var NT_DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'default', 'k1', 'k2', 'k3', 's1', 's2', 'dkim', 'mail', 'smtp', 'mxvault', 'fm1', 'fm2', 'fm3', 'zoho', 'protonmail', 'protonmail2', 'protonmail3', 'mandrill', 'mailjet', 'everlytickey1', 'everlytickey2', 'key1', 'key2', 'sig1', 'hs1', 'hs2', 'cm', 'pm', 'dk', 'x', '20230601', '20221208', '20210112', '20161025', 's1024', 's2048'];

async function ntSpfFetch(domain) {
  var r = await ntDns(domain, 'TXT');
  if (r.status === 3) return { nx: true, recs: [] };
  return { recs: r.answers.map(function (a) { return ntTxt(a.data); }).filter(function (t) { return /^v=spf1(\s|$)/i.test(t.trim()); }) };
}
async function ntSpfAnalyze(domain) {
  var res = { issues: [], lookups: 0, voids: 0 };
  var top = await ntSpfFetch(domain);
  if (top.nx) { res.nx = true; return res; }
  if (!top.recs.length) { res.none = true; return res; }
  if (top.recs.length > 1) res.issues.push(['ng', 'SPFレコードが' + top.recs.length + '件あります。SPFは1つのドメインに1件だけにしてください（複数あると受信側で判定エラー＝permerrorになります）。']);
  res.record = top.recs[0];

  async function walk(dom, rec, depth, path) {
    var node = { dom: dom, rec: rec, kids: [] };
    var terms = rec.trim().split(/\s+/).slice(1);
    var allSeen = false, subs = [];
    terms.forEach(function (raw) {
      var t = raw, q = '+';
      if (/^[+\-~?]/.test(t)) { q = t[0]; t = t.slice(1); }
      var mod = t.match(/^([a-z][a-z0-9_.-]*)=(.*)$/i);
      if (mod) {
        var k = mod[1].toLowerCase();
        if (k === 'redirect') { res.lookups++; if (depth === 0) res.redirect = mod[2]; if (!allSeen) subs.push(['redirect=' + mod[2], mod[2]]); }
        else if (k !== 'exp') res.issues.push(['warn', '見慣れない記述「' + ntEsc(raw) + '」があります（' + ntEsc(dom) + '）。']);
        return;
      }
      var m = t.match(/^(all|include|a|mx|ptr|ip4|ip6|exists)(?::(.+?))?(\/.*)?$/i);
      if (!m) { res.issues.push(['ng', 'SPFの書式として正しくない記述「' + ntEsc(raw) + '」があります（' + ntEsc(dom) + '）。タイプミスや全角文字が混じっていないか確認してください。']); return; }
      var mech = m[1].toLowerCase(), val = m[2] || '', cidr = m[3] || '';
      if (allSeen) { res.issues.push(['warn', '「all」より後ろにある「' + ntEsc(raw) + '」は評価されません（' + ntEsc(dom) + '）。']); return; }
      if (mech === 'all') { allSeen = true; if (depth === 0) res.all = q; }
      else if (mech === 'ip4') { if (!ntV4(val) || (cidr && !(+cidr.slice(1) <= 32))) res.issues.push(['ng', 'ip4の値「' + ntEsc(raw) + '」が正しくありません（' + ntEsc(dom) + '）。']); }
      else if (mech === 'ip6') { if (!ntV6(val) || (cidr && !(+cidr.slice(1) <= 128))) res.issues.push(['ng', 'ip6の値「' + ntEsc(raw) + '」が正しくありません（' + ntEsc(dom) + '）。']); }
      else if (mech === 'include') { res.lookups++; if (!val) res.issues.push(['ng', '「include:」の後ろにドメイン名がありません（' + ntEsc(dom) + '）。']); else subs.push(['include:' + val, val]); }
      else if (mech === 'ptr') { res.lookups++; res.issues.push(['warn', '「ptr」は非推奨です（RFC 7208）。処理が重く、受信側で無視されることがあります（' + ntEsc(dom) + '）。']); }
      else { res.lookups++; if (mech === 'exists' && !val) res.issues.push(['ng', '「exists:」の後ろにドメイン名がありません（' + ntEsc(dom) + '）。']); }
    });
    await Promise.all(subs.map(async function (s) {
      var kid = { label: s[0], dom: s[1], rec: null, kids: [] };
      node.kids.push(kid);
      var target = s[1].toLowerCase().replace(/\.$/, '');
      if (target.indexOf('%{') >= 0) { kid.note = 'マクロを含むため展開していません'; return; }
      if (path.indexOf(target) >= 0 || depth >= 10) { kid.note = '参照がループしています'; res.issues.push(['ng', '「' + ntEsc(s[0]) + '」で参照がループしています。']); return; }
      var r;
      try { r = await ntSpfFetch(target); } catch (e) { kid.note = '取得できませんでした'; return; }
      if (!r.recs.length) {
        res.voids++;
        kid.note = r.nx ? 'ドメインが存在しません' : 'SPFレコードがありません';
        res.issues.push(['ng', '「' + ntEsc(s[0]) + '」の参照先にSPFレコードがありません（' + kid.note + '）。この行は受信側でエラー（permerror）になります。解約したサービスの記述が残っていないか確認してください。']);
        return;
      }
      if (r.recs.length > 1) res.issues.push(['ng', '「' + ntEsc(target) + '」にSPFレコードが複数あります。']);
      var sub = await walk(target, r.recs[0], depth + 1, path.concat([target]));
      kid.rec = sub.rec; kid.kids = sub.kids;
    }));
    return node;
  }
  res.root = await walk(domain, top.recs[0], 0, [domain]);

  if (res.lookups > 10) res.issues.unshift(['ng', 'DNS参照の回数が<b>' + res.lookups + '回</b>で、上限の10回を超えています。受信側でSPFがエラー（permerror）になり、認証に失敗します。使っていないincludeを外すか、ip4/ip6での直接指定に置き換えてください。']);
  else if (res.lookups >= 8) res.issues.push(['warn', 'DNS参照の回数が' + res.lookups + '回です（上限10回）。送信サービスを1つ追加すると上限を超えるおそれがあります。']);
  if (res.voids > 2) res.issues.push(['ng', '存在しない参照先（void lookup）が' + res.voids + '件あります。上限の2件を超えるとエラーになります。']);
  if (!res.redirect) {
    if (!res.all) res.issues.push(['warn', '末尾に「~all」または「-all」がありません。指定がないと、記載していないサーバーから送られたメールも「中立（neutral）」扱いになり、なりすまし対策として弱くなります。']);
    else if (res.all === '+') res.issues.push(['ng', '「+all」は、世界中のどのサーバーからの送信も正規と認める設定です。なりすまし対策の意味がなくなるため、「~all」か「-all」にしてください。']);
    else if (res.all === '?') res.issues.push(['warn', '「?all」は判定を「中立」にするだけで、なりすまし対策の効果がほとんどありません。']);
  }
  res.ok = !res.issues.some(function (i) { return i[0] === 'ng'; });
  return res;
}
function ntSpfTree(node) {
  if (!node.kids.length) return '';
  return '<ul class="nt-tree">' + node.kids.map(function (k) {
    return '<li><code>' + ntEsc(k.label) + '</code>' + (k.rec ? ' → <span class="nt-code" style="display:inline">' + ntEsc(k.rec) + '</span>' : '') + (k.note ? ' ' + ntBadge('ng', k.note) : '') + ntSpfTree(k) + '</li>';
  }).join('') + '</ul>';
}

async function ntDmarcAnalyze(domain) {
  var cands = [domain], org = ntOrgDomain(domain);
  if (org !== domain) cands.push(org);
  for (var i = 0; i < cands.length; i++) {
    var d = cands[i];
    var r = await ntDns('_dmarc.' + d, 'TXT');
    var recs = r.answers.map(function (a) { return ntTxt(a.data); }).filter(function (t) { return /^v\s*=\s*DMARC1\s*(;|$)/i.test(t.trim()); });
    if (recs.length) return ntDmarcEval(domain, d, recs);
  }
  return { none: true, issues: [] };
}
async function ntDmarcEval(domain, d, recs) {
  var res = { issues: [], from: d, inherited: d !== domain, record: recs[0], tags: {} };
  if (recs.length > 1) res.issues.push(['ng', 'DMARCレコードが' + recs.length + '件あります。複数あると受信側はDMARCを適用しません。1件にまとめてください。']);
  recs[0].split(';').forEach(function (p) { var i = p.indexOf('='); if (i > 0) res.tags[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim(); });
  var t = res.tags;
  var pol = ((res.inherited && t.sp) ? t.sp : (t.p || '')).toLowerCase();
  res.policy = pol;
  if (!t.p) res.issues.push(['ng', '必須の「p=」（ポリシー）がありません。']);
  else if (['none', 'quarantine', 'reject'].indexOf(t.p.toLowerCase()) < 0) res.issues.push(['ng', '「p=」の値が正しくありません（none / quarantine / reject のいずれか）。']);
  if (pol === 'none') res.issues.push(['warn', 'ポリシーが「none」（監視のみ）です。レポートは届きますが、なりすましメールは止まりません。正規の送信元がすべて認証に通ることをレポートで確かめてから、quarantine → reject と段階的に強めるのが一般的です。']);
  if (pol === 'quarantine') res.issues.push(['ok', 'ポリシーは「quarantine」（認証に失敗したメールを迷惑メール扱いにする）です。']);
  if (pol === 'reject') res.issues.push(['ok', 'ポリシーは「reject」（認証に失敗したメールを受信拒否する）で、最も強い設定です。']);
  if (t.pct && +t.pct < 100 && pol !== 'none') res.issues.push(['warn', 'pct=' + ntEsc(t.pct) + ' のため、ポリシーが適用されるのは認証に失敗したメールの' + ntEsc(t.pct) + '%だけです。']);
  if (!t.rua) res.issues.push(['warn', '集計レポートの送付先（rua=）がありません。DMARCの結果を受け取れないため、正規のメールが失敗していても気づけません。']);
  else {
    var addrs = t.rua.split(',').map(function (x) { return x.trim().replace(/^mailto:/i, '').replace(/!.*$/, ''); }).filter(Boolean);
    await Promise.all(addrs.map(async function (a) {
      var rd = (a.split('@')[1] || '').toLowerCase();
      if (!rd || ntOrgDomain(rd) === ntOrgDomain(d)) return;
      try {
        var r = await ntDns(d + '._report._dmarc.' + rd, 'TXT');
        var ok = r.answers.some(function (x) { return /^v\s*=\s*DMARC1/i.test(ntTxt(x.data).trim()); });
        res.issues.push(ok ? ['ok', 'レポート送付先 ' + ntEsc(a) + ' は別ドメインですが、受け取り側の許可レコードを確認できました。']
          : ['warn', 'レポート送付先 ' + ntEsc(a) + ' は別ドメインです。受け取り側に許可レコード「' + ntEsc(d + '._report._dmarc.' + rd) + '」が見つからないため、レポートが届かない可能性があります（レポート集計サービスの多くはワイルドカードで設定済みのため、届いていれば問題ありません）。']);
      } catch (e) { }
    }));
  }
  if (res.inherited) res.issues.push(['info', ntEsc(domain) + ' には独自のDMARCがないため、組織ドメイン ' + ntEsc(d) + ' の設定が適用されます（サブドメイン向けのポリシー sp=' + ntEsc(t.sp || '指定なし＝pと同じ') + '）。']);
  res.ok = !res.issues.some(function (i) { return i[0] === 'ng'; });
  return res;
}
var NT_DMARC_TAGS = { v: 'バージョン', p: 'ポリシー（none=監視のみ／quarantine=迷惑メール扱い／reject=拒否）', sp: 'サブドメインのポリシー', pct: 'ポリシーを適用する割合（%）', rua: '集計レポートの送付先', ruf: '失敗レポート（個別）の送付先', adkim: 'DKIMの一致判定（r=緩やか／s=厳密）', aspf: 'SPFの一致判定（r=緩やか／s=厳密）', fo: '失敗レポートを送る条件', ri: 'レポートの間隔（秒）', np: '存在しないサブドメインのポリシー' };

function ntDkimBits(p, k) {
  if (/ed25519/i.test(k || '')) return 256;
  var bin;
  try { bin = atob(p.replace(/\s/g, '')); } catch (e) { return null; }
  var b = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
  var i = 0;
  function len() { var l = b[i++]; if (l & 0x80) { var n = l & 0x7f; l = 0; for (var j = 0; j < n; j++) l = l * 256 + b[i++]; } return l; }
  try {
    if (b[i++] !== 0x30) return null; len();
    if (b[i] === 0x30) {
      i++; i += len();
      if (b[i++] !== 0x03) return null; len(); i++;
      if (b[i++] !== 0x30) return null; len();
    }
    if (b[i++] !== 0x02) return null;
    var l = len();
    while (l > 0 && b[i] === 0) { i++; l--; }
    return l * 8 - (Math.clz32(b[i]) - 24);
  } catch (e) { return null; }
}
function ntDkimEval(sel, rec) {
  var tags = {};
  rec.split(';').forEach(function (p) { var i = p.indexOf('='); if (i > 0) tags[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim(); });
  var res = { sel: sel, record: rec, issues: [], k: (tags.k || 'rsa').toLowerCase() };
  var p = (tags.p || '').replace(/\s/g, '');
  if (!p) { res.issues.push(['info', '公開鍵（p=）が空で、この鍵は失効済みです。鍵を新しいセレクタに切り替えた後に、古い鍵をこの形で残すのは正常な運用です。']); res.revoked = true; }
  else {
    res.bits = ntDkimBits(p, res.k);
    if (res.bits == null) res.issues.push(['warn', '公開鍵の長さを読み取れませんでした（鍵の文字列が途中で切れていないか確認してください）。']);
    else if (res.k === 'ed25519') res.issues.push(['ok', 'Ed25519鍵です。']);
    else if (res.bits < 1024) res.issues.push(['ng', '鍵の長さが' + res.bits + 'ビットです。1024ビット未満は多くの受信側で無効と扱われます。2048ビットの鍵に更新してください。']);
    else if (res.bits < 2048) res.issues.push(['warn', '鍵の長さが' + res.bits + 'ビットです。現在は2048ビットが推奨されています。']);
    else res.issues.push(['ok', '鍵の長さは' + res.bits + 'ビットです。']);
  }
  if (/(^|:)\s*y\s*(:|$)/i.test(tags.t || '')) res.issues.push(['warn', 'テストモード（t=y）です。受信側がDKIMの結果を重視しない場合があります。']);
  res.ok = !res.issues.some(function (i) { return i[0] === 'ng'; });
  return res;
}
async function ntDkimFind(domain, sel) {
  var sels = sel ? [sel] : NT_DKIM_SELECTORS;
  var found = [];
  await Promise.all(sels.map(async function (s) {
    try {
      var r = await ntDns(s + '._domainkey.' + domain, 'TXT');
      var recs = r.answers.map(function (a) { return ntTxt(a.data); }).filter(function (t) { return /(^|;)\s*p\s*=/i.test(t) || /v\s*=\s*DKIM1/i.test(t); });
      if (recs.length) found.push(ntDkimEval(s, recs[0]));
    } catch (e) { }
  }));
  found.sort(function (a, b) { return sels.indexOf(a.sel) - sels.indexOf(b.sel); });
  return { sel: sel, found: found };
}
var NT_MX_PROVIDERS = [[/(^|\.)google(mail)?\.com$/, 'Google Workspace（Gmail）'], [/\.outlook\.com$/, 'Microsoft 365（Exchange Online）'], [/\.zoho\.(com|jp|eu)$/, 'Zoho Mail'], [/\.protonmail\.ch$/, 'Proton Mail'], [/\.icloud\.com$/, 'iCloudメール'], [/\.secureserver\.net$/, 'GoDaddy'], [/\.xserver\.jp$/, 'エックスサーバー'], [/\.sakura\.ne\.jp$/, 'さくらのレンタルサーバ'], [/\.amazonaws\.com$/, 'Amazon SES / WorkMail'], [/\.messagingengine\.com$/, 'Fastmail']];
async function ntMx(d) {
  var r = await ntDns(d, 'MX');
  return r.answers.map(function (a) { var p = a.data.split(/\s+/); return { pri: +p[0], host: (p[1] || '').replace(/\.$/, '') }; }).sort(function (a, b) { return a.pri - b.pri; });
}
async function ntMailExtra(d) {
  var q = async function (name, re) { try { var r = await ntDns(name, 'TXT'); var t = r.answers.map(function (a) { return ntTxt(a.data); }).filter(function (x) { return re.test(x); }); return t[0] || null; } catch (e) { return null; } };
  var out = await Promise.all([q('_mta-sts.' + d, /^v=STSv1/i), q('_smtp._tls.' + d, /^v=TLSRPTv1/i), q('default._bimi.' + d, /^v=BIMI1/i)]);
  return { mtasts: out[0], tlsrpt: out[1], bimi: out[2] };
}

async function ntMailAuth() {
  var out = ntEl('maOut'), btn = ntEl('maBtn');
  var d = ntDomain(ntVal('maDomain'));
  if (!ntIsDomain(d)) { out.innerHTML = ntErr('ドメイン名を正しく入力してください（例: example.com、info@example.com）。'); return; }
  var sel = ntVal('maSel').trim().toLowerCase().replace(/\._domainkey.*$/, '');
  btn.disabled = true;
  out.innerHTML = ntLoading(d + ' のSPF・DKIM・DMARCを確認しています…');
  try {
    var r = await Promise.all([ntSpfAnalyze(d), ntDmarcAnalyze(d), ntDkimFind(d, sel), ntMx(d), ntMailExtra(d)]);
    var spf = r[0], dmarc = r[1], dkim = r[2], mx = r[3], ex = r[4];
    if (spf.nx) { out.innerHTML = ntErr(ntEsc(d) + ' はDNSに存在しません（NXDOMAIN）。ドメイン名の綴りを確認してください。'); return; }
    var dkimOk = dkim.found.some(function (k) { return k.ok && !k.revoked; });
    var dkimAllRevoked = dkim.found.length && dkim.found.every(function (k) { return k.revoked; });
    var spfSt = spf.none ? ['ng', '未設定'] : spf.ok ? (spf.issues.some(function (i) { return i[0] === 'warn'; }) ? ['warn', '設定あり・要確認'] : ['ok', '設定あり']) : ['ng', '要修正'];
    var dkimSt = dkimOk ? ['ok', '確認済み（' + dkim.found.filter(function (k) { return k.ok && !k.revoked; }).map(function (k) { return k.sel; }).join(', ') + '）'] : dkimAllRevoked ? ['warn', '失効済みの鍵のみ'] : dkim.found.length ? ['ng', '要修正'] : sel ? ['ng', '指定のセレクタに鍵なし'] : ['warn', '自動では見つからず'];
    var dmSt = dmarc.none ? ['ng', '未設定'] : !dmarc.ok ? ['ng', '要修正'] : dmarc.policy === 'none' ? ['warn', 'p=none（監視のみ）'] : ['ok', 'p=' + dmarc.policy];
    var spfValid = !spf.none && spf.ok, dmValid = !dmarc.none && dmarc.ok;
    var g1 = spfValid || dkimOk, g2 = spfValid && dkimOk && dmValid;
    var html = ntCard('診断結果: ' + ntEsc(d), '',
      '<div class="nt-tblwrap"><table class="nt-tbl">' +
      '<tr><th>SPF</th><td>' + ntBadge(spfSt[0], spfSt[1]) + '</td></tr>' +
      '<tr><th>DKIM</th><td>' + ntBadge(dkimSt[0], dkimSt[1]) + '</td></tr>' +
      '<tr><th>DMARC</th><td>' + ntBadge(dmSt[0], dmSt[1]) + '</td></tr>' +
      '<tr><th>Gmail等の要件<br>（全送信者）</th><td>' + ntBadge(g1 ? 'ok' : 'ng', g1 ? '満たしています' : '満たしていません') + ' SPFまたはDKIMのどちらかが必要</td></tr>' +
      '<tr><th>Gmail等の要件<br>（1日5,000通以上）</th><td>' + ntBadge(g2 ? 'ok' : (spfValid && dmValid && !dkimOk && !sel ? 'warn' : 'ng'), g2 ? '満たしています' : (spfValid && dmValid && !dkimOk && !sel ? 'DKIMを確認できず' : '満たしていません')) + ' SPF・DKIM・DMARC（p=noneでも可）のすべてが必要</td></tr>' +
      '</table></div><div class="nt-note">「Gmail等の要件」は、Gmail・Yahoo!（2024年2月〜）とOutlook.com（2025年5月〜）が送信者に求めている認証の要件です。差出人（From）のドメインとSPF・DKIMのドメインが一致しているか（アラインメント）は、実際に送ったメールのヘッダーで確認してください。</div>');

    // SPF
    var spfBody = spf.none ? '<div>SPFレコード（「v=spf1」で始まるTXTレコード）が見つかりません。このドメインを名乗ったなりすましメールを、受信側が見分けられない状態です。メールを送るサービス（Google Workspace、Microsoft 365、配信サービスなど）の案内に沿って設定してください。</div>'
      : '<div class="nt-code">' + ntEsc(spf.record) + '</div><div class="nt-note">DNS参照の回数: <b>' + spf.lookups + '</b> / 10回' + (spf.all ? '　末尾の判定: <b>' + ntEsc(spf.all === '+' ? '+all' : spf.all + 'all') + '</b>' + (spf.all === '-' ? '（記載外は失敗＝拒否を推奨）' : spf.all === '~' ? '（記載外は疑わしいとして扱う）' : '') : '') + '</div>' + ntSpfTree(spf.root) + ntIssues(spf.issues);
    html += ntCard('SPF', ntBadge(spfSt[0], spfSt[1]), spfBody);

    // DKIM
    var dkBody;
    if (!dkim.found.length) {
      dkBody = sel ? '<div>セレクタ「' + ntEsc(sel) + '」（' + ntEsc(sel + '._domainkey.' + d) + '）にDKIMの公開鍵が見つかりません。セレクタ名の綴りと、DNSへの登録状況を確認してください。</div>'
        : '<div>よく使われるセレクタ（google、selector1、selector2、k1 など' + NT_DKIM_SELECTORS.length + '種類）を探しましたが、見つかりませんでした。DKIMのセレクタは送信サービスごとに自由に決められるため、<b>未設定とは限りません</b>。受信したメールのヘッダーにある「DKIM-Signature」の「s=」の値を上の欄に入れて再確認してください。</div>';
    } else {
      dkBody = dkim.found.map(function (k) {
        return '<div style="margin-top:6px"><b>セレクタ: ' + ntEsc(k.sel) + '</b>（' + ntEsc(k.k.toUpperCase()) + (k.bits ? '・' + k.bits + 'ビット' : '') + '）<div class="nt-code">' + ntEsc(k.record.length > 220 ? k.record.slice(0, 220) + '…' : k.record) + '</div>' + ntIssues(k.issues) + '</div>';
      }).join('') + (sel ? '' : '<div class="nt-note">自動検出は主要なセレクタのみが対象です。' + (dkimOk ? '' : '有効な鍵が見つからなくても、ここに無いセレクタで署名している場合があります。受信したメールの「DKIM-Signature」の「s=」の値を上の欄に入れて確認してください。') + '</div>');
    }
    html += ntCard('DKIM', ntBadge(dkimSt[0], dkimSt[1]), dkBody);

    // DMARC
    var dmBody;
    if (dmarc.none) dmBody = '<div>DMARCレコード（_dmarc.' + ntEsc(d) + ' のTXT）が見つかりません。1日5,000通以上をGmail等へ送る場合は必須です。まずは監視のみの設定から始められます。</div><div class="nt-code">_dmarc.' + ntEsc(d) + '  TXT  "v=DMARC1; p=none; rua=mailto:dmarc-report@' + ntEsc(d) + '"</div><div class="nt-note">rua= にはレポートを受け取るメールアドレスを指定します（上は例です）。</div>';
    else {
      dmBody = '<div class="nt-code">' + ntEsc(dmarc.record) + '</div><div class="nt-tblwrap"><table class="nt-tbl">' + Object.keys(dmarc.tags).map(function (k) { return '<tr><th>' + ntEsc(k) + '</th><td>' + ntEsc(dmarc.tags[k]) + (NT_DMARC_TAGS[k] ? '<div class="nt-note" style="margin:0">' + NT_DMARC_TAGS[k] + '</div>' : '') + '</td></tr>'; }).join('') + '</table></div>' + ntIssues(dmarc.issues);
    }
    html += ntCard('DMARC', ntBadge(dmSt[0], dmSt[1]), dmBody);

    // MX・その他
    var mxBody = !mx.length ? '<div>MXレコードがありません。このドメイン宛てのメールは、Aレコードのサーバーへ届けられるか、届きません。</div>'
      : (mx.length === 1 && mx[0].host === '' ? '<div>「Null MX」（0 .）が設定されています。このドメインはメールを受け取らないと宣言しています。</div>'
        : '<div class="nt-tblwrap"><table class="nt-tbl"><tr><th>優先度</th><th>メールサーバー</th><th>推定サービス</th></tr>' + mx.map(function (m) { var p = NT_MX_PROVIDERS.filter(function (x) { return x[0].test(m.host); })[0]; return '<tr><td>' + m.pri + '</td><td>' + ntEsc(m.host) + '</td><td>' + (p ? p[1] : '—') + '</td></tr>'; }).join('') + '</table></div>');
    html += ntCard('MX（受信メールサーバー）', '', mxBody);
    html += ntCard('その他の関連設定（任意）', '',
      '<div class="nt-tblwrap"><table class="nt-tbl">' +
      '<tr><th>MTA-STS</th><td>' + (ex.mtasts ? ntBadge('ok', 'あり') + ' <span class="nt-code" style="display:inline">' + ntEsc(ex.mtasts) + '</span>' : ntBadge('info', 'なし')) + '<div class="nt-note" style="margin:0">受信時のTLS暗号化を必須にする仕組み</div></td></tr>' +
      '<tr><th>TLS-RPT</th><td>' + (ex.tlsrpt ? ntBadge('ok', 'あり') + ' <span class="nt-code" style="display:inline">' + ntEsc(ex.tlsrpt) + '</span>' : ntBadge('info', 'なし')) + '<div class="nt-note" style="margin:0">TLS接続の失敗レポートの送付先</div></td></tr>' +
      '<tr><th>BIMI</th><td>' + (ex.bimi ? ntBadge('ok', 'あり') + ' <span class="nt-code" style="display:inline">' + ntEsc(ex.bimi) + '</span>' : ntBadge('info', 'なし')) + '<div class="nt-note" style="margin:0">受信トレイに企業ロゴを表示する仕組み（DMARCがquarantine以上で利用可）</div></td></tr>' +
      '</table></div>');
    out.innerHTML = html;
  } catch (e) {
    out.innerHTML = ntErr(ntEsc(e.message));
  } finally { btn.disabled = false; }
}

/* ════ 2. DNSレコード検索 ════ */
function ntTtl(s) { s = +s; if (s < 60) return s + '秒'; if (s < 3600) return s + '秒（' + Math.round(s / 60) + '分）'; if (s < 86400) return s + '秒（' + (Math.round(s / 360) / 10) + '時間）'; return s + '秒（' + (Math.round(s / 8640) / 10) + '日）'; }
async function ntDnsLookup() {
  var out = ntEl('dlOut'), btn = ntEl('dlBtn');
  var raw = ntVal('dlName').trim(), type = ntVal('dlType'), resv = ntVal('dlRes');
  var ipRev = ntReverseName(raw.replace(/^\[|\]$/g, ''));
  var name = ipRev || ntDomain(raw);
  if (!ipRev && !ntIsDomain(name)) { out.innerHTML = ntErr('ドメイン名またはIPアドレスを正しく入力してください（例: example.com、8.8.8.8）。'); return; }
  var types = ipRev ? ['PTR'] : type === 'ALL' ? ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA'] : [type];
  btn.disabled = true;
  out.innerHTML = ntLoading(name + ' を問い合わせています…');
  try {
    var rs = await Promise.all(types.map(function (t) { return ntDns(name, t, resv); }));
    var nx = rs.filter(function (r) { return r.status !== 0; })[0];
    if (nx && rs.every(function (r) { return r.status !== 0; })) { out.innerHTML = ntErr(ntEsc(name) + ': ' + (NT_RCODE[nx.status] || 'エラー（RCODE ' + nx.status + '）')); return; }
    var rows = '', seen = {};
    rs.forEach(function (r, i) {
      var list = type === 'ALL' && !ipRev ? r.answers : r.all;
      if (!list.length) { rows += '<tr><td>' + types[i] + '</td><td colspan="3" style="color:var(--muted)">レコードなし</td></tr>'; return; }
      list.forEach(function (a) {
        var key = a.type + '|' + a.name + '|' + a.data;
        if (seen[key]) return; seen[key] = 1;
        var tn = NT_TYPENAME[a.type] || ('TYPE' + a.type);
        var v = tn === 'TXT' ? ntTxt(a.data) : a.data;
        rows += '<tr><td><b>' + tn + '</b></td><td>' + ntEsc(String(a.name).replace(/\.$/, '')) + '</td><td>' + ntEsc(v) + '</td><td>' + ntTtl(a.TTL) + '</td></tr>';
      });
    });
    var ad = rs.some(function (r) { return r.ad; });
    out.innerHTML = ntCard('検索結果: ' + ntEsc(name), ad ? ntBadge('ok', 'DNSSEC検証済み') : ntBadge('info', 'DNSSECなし'),
      '<div class="nt-tblwrap"><table class="nt-tbl"><tr><th>種類</th><th>名前</th><th>値</th><th>TTL</th></tr>' + rows + '</table></div>' +
      '<div class="nt-note">問い合わせ先: ' + (resv === 'google' ? 'Google Public DNS（8.8.8.8）' : 'Cloudflare（1.1.1.1）') + '。TTLはキャッシュの残り時間のため、問い合わせのたびに変わります。DNSを変更した直後は、古い値がTTLの間残ることがあります。</div>');
  } catch (e) { out.innerHTML = ntErr(ntEsc(e.message)); }
  finally { btn.disabled = false; }
}

/* ════ 3. IPアドレス確認 ════ */
async function ntAsn(ip) {
  var o = ntV4(ip), g = o ? null : ntV6(ip);
  var q = o ? o.slice().reverse().join('.') + '.origin.asn.cymru.com' : g ? ntV6Full(g).replace(/:/g, '').split('').reverse().join('.') + '.origin6.asn.cymru.com' : null;
  if (!q) return null;
  var r = await ntDns(q, 'TXT');
  if (!r.answers.length) return null;
  var f = ntTxt(r.answers[0].data).split('|').map(function (x) { return x.trim(); });
  var asn = f[0].split(/\s+/)[0];
  var res = { asn: asn, prefix: f[1], cc: f[2], registry: f[3] };
  try {
    var n = await ntDns('AS' + asn + '.asn.cymru.com', 'TXT');
    if (n.answers.length) { var nf = ntTxt(n.answers[0].data).split('|'); res.name = (nf[4] || '').trim(); }
  } catch (e) { }
  return res;
}
async function ntPtr(ip) {
  var rn = ntReverseName(ip);
  if (!rn) return null;
  try { var r = await ntDns(rn, 'PTR'); return r.answers.length ? r.answers.map(function (a) { return a.data.replace(/\.$/, ''); }).join(', ') : null; } catch (e) { return null; }
}
async function ntMyIp() {
  var out = ntEl('miOut');
  if (!out) return;
  out.innerHTML = ntLoading('IPアドレスを確認しています…');
  var get = async function (u) { try { var r = await ntFetchT(u, {}, 6000); return (await r.json()).ip; } catch (e) { return null; } };
  var ips = await Promise.all([get('https://api.ipify.org?format=json'), get('https://api6.ipify.org?format=json')]);
  var v4 = ips[0], v6 = ips[1] && ntV6(ips[1]) ? ips[1] : null;
  if (!v4 && !v6) { out.innerHTML = ntErr('IPアドレスを取得できませんでした。広告ブロッカーなどで外部への通信が止められていないか確認してください。'); return; }
  var main = v4 || v6;
  var info = await Promise.all([ntAsn(main).catch(function () { return null; }), ntPtr(main)]);
  var asn = info[0], ptr = info[1];
  var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { }
  out.innerHTML =
    ntCard('あなたのIPアドレス', '',
      '<div class="nt-tblwrap"><table class="nt-tbl">' +
      '<tr><th>IPv4</th><td>' + (v4 ? '<span class="nt-big">' + ntEsc(v4) + '</span> <button class="nt-btn" style="padding:3px 10px;font-size:.72rem" onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + ntEsc(v4) + '\')">コピー</button>' : '取得できませんでした') + '</td></tr>' +
      '<tr><th>IPv6</th><td>' + (v6 ? '<span class="nt-big" style="font-size:1rem">' + ntEsc(v6) + '</span>' : '—') + '</td></tr>' +
      '<tr><th>IPv6での接続</th><td>' + (v6 ? ntBadge('ok', 'できます') : ntBadge('info', 'できませんでした')) + (v6 ? '' : '<div class="nt-note" style="margin:0">回線・ルーター・プロバイダのいずれかがIPv6に対応していないか、無効になっています。</div>') + '</td></tr>' +
      '<tr><th>ホスト名（逆引き）</th><td>' + ntEsc(ptr || '設定なし') + '</td></tr>' +
      '<tr><th>接続事業者（AS）</th><td>' + (asn ? 'AS' + ntEsc(asn.asn) + ' ' + ntEsc(asn.name || '') : '—') + '</td></tr>' +
      '<tr><th>国</th><td>' + (asn ? ntEsc(ntCountry(asn.cc)) : '—') + '</td></tr>' +
      '</table></div>') +
    ntCard('ブラウザの情報', '',
      '<div class="nt-tblwrap"><table class="nt-tbl">' +
      '<tr><th>ユーザーエージェント</th><td>' + ntEsc(navigator.userAgent) + '</td></tr>' +
      '<tr><th>言語</th><td>' + ntEsc((navigator.languages || [navigator.language]).join(', ')) + '</td></tr>' +
      '<tr><th>タイムゾーン</th><td>' + ntEsc(tz) + '</td></tr>' +
      '<tr><th>画面サイズ</th><td>' + screen.width + ' × ' + screen.height + '（表示領域 ' + window.innerWidth + ' × ' + window.innerHeight + '）</td></tr>' +
      '<tr><th>Cookie</th><td>' + (navigator.cookieEnabled ? '有効' : '無効') + '</td></tr>' +
      '</table></div>') +
    '<div class="nt-note">IPアドレスは外部サービス ipify（api.ipify.org）から、接続事業者はTeam CymruのDNSから取得しています。ToolsLab.はIPアドレスを保存しません。VPNやプロキシを使っている場合は、その出口のIPアドレスが表示されます。</div>';
}

/* ════ 4. IPアドレス情報検索 ════ */
async function ntIpInfo() {
  var out = ntEl('iiOut'), btn = ntEl('iiBtn');
  var raw = ntVal('iiQ').trim().replace(/^\[|\]$/g, '');
  var ip = raw, host = null;
  btn.disabled = true;
  try {
    if (!ntV4(ip) && !ntV6(ip)) {
      host = ntDomain(raw);
      if (!ntIsDomain(host)) { out.innerHTML = ntErr('IPアドレスまたはホスト名を正しく入力してください（例: 8.8.8.8、example.com）。'); return; }
      out.innerHTML = ntLoading(host + ' のIPアドレスを調べています…');
      var a = await ntDns(host, 'A');
      ip = a.answers.length ? a.answers[0].data : null;
      if (!ip) { var a6 = await ntDns(host, 'AAAA'); ip = a6.answers.length ? a6.answers[0].data : null; }
      if (!ip) { out.innerHTML = ntErr(ntEsc(host) + ' のIPアドレス（A・AAAAレコード）が見つかりません。'); return; }
    }
    out.innerHTML = ntLoading(ip + ' の情報を調べています…');
    var o = ntV4(ip), g = o ? null : ntV6(ip);
    var typ = o ? ntV4Type(o) : ntV6Type(g);
    var rows = '<tr><th>IPアドレス</th><td><span class="nt-big" style="font-size:1.05rem">' + ntEsc(o ? ip : ntV6Str(g)) + '</span>' + (host ? '<div class="nt-note" style="margin:0">' + ntEsc(host) + ' から解決</div>' : '') + '</td></tr>' +
      '<tr><th>種類</th><td>' + ntBadge(typ[0] === 'global' ? 'ok' : 'info', typ[0] === 'global' ? 'グローバル' : typ[0] === 'private' ? 'プライベート' : '特殊用途') + ' ' + typ[1] + '</td></tr>';
    if (o) { var n = ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3]; rows += '<tr><th>10進数・16進数</th><td>' + n + ' ／ 0x' + ('0000000' + n.toString(16).toUpperCase()).slice(-8) + '</td></tr>'; }
    else rows += '<tr><th>省略なし表記</th><td>' + ntV6Full(g) + '</td></tr>';
    if (typ[0] !== 'global') {
      out.innerHTML = ntCard('IPアドレス情報', '', '<div class="nt-tblwrap"><table class="nt-tbl">' + rows + '</table></div><div class="nt-note">グローバルIPアドレスではないため、インターネット上の登録情報（管理組織・AS番号など）はありません。</div>');
      return;
    }
    var info = await Promise.all([ntPtr(ip), ntAsn(ip).catch(function () { return null; }), ntFetchT('https://rdap.org/ip/' + encodeURIComponent(o ? ip : ntV6Str(g)), {}, 15000).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })]);
    var ptr = info[0], asn = info[1], rd = info[2];
    rows += '<tr><th>ホスト名（逆引き）</th><td>' + ntEsc(ptr || '設定なし') + '</td></tr>';
    if (asn) rows += '<tr><th>AS番号</th><td>AS' + ntEsc(asn.asn) + ' ' + ntEsc(asn.name || '') + '</td></tr><tr><th>経路（プレフィックス）</th><td>' + ntEsc(asn.prefix) + '</td></tr><tr><th>国</th><td>' + ntEsc(ntCountry(asn.cc)) + '</td></tr><tr><th>地域インターネットレジストリ</th><td>' + ntEsc((asn.registry || '').toUpperCase()) + '</td></tr>';
    if (rd) {
      var org = '';
      (rd.entities || []).some(function (e) {
        var fn = ((e.vcardArray || [])[1] || []).filter(function (v) { return v[0] === 'fn'; })[0];
        if (fn && fn[3]) { org = fn[3]; return (e.roles || []).indexOf('registrant') >= 0; }
        return false;
      });
      rows += '<tr><th>ネットワーク名</th><td>' + ntEsc(rd.name || '—') + '</td></tr>' +
        '<tr><th>割り当て範囲</th><td>' + ntEsc((rd.startAddress || '') + ' – ' + (rd.endAddress || '')) + '</td></tr>' +
        (org ? '<tr><th>管理組織</th><td>' + ntEsc(org) + '</td></tr>' : '');
    }
    out.innerHTML = ntCard('IPアドレス情報', '', '<div class="nt-tblwrap"><table class="nt-tbl">' + rows + '</table></div>') +
      '<div class="nt-note">逆引きとAS番号はDNS（Team Cymru）、ネットワーク名と管理組織はRDAP（rdap.org経由で各地域レジストリ）から取得しています。国はIPアドレスの登録国で、利用者の実際の所在地とは異なることがあります。</div>';
  } catch (e) { out.innerHTML = ntErr(ntEsc(e.message)); }
  finally { btn.disabled = false; }
}

/* ════ 5. サブネット計算 ════ */
function ntSubnetInit() {
  var sel = ntEl('snPfx');
  if (sel && !sel.options.length) {
    var h = '';
    for (var p = 32; p >= 1; p--) { var m = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; h += '<option value="' + p + '"' + (p === 24 ? ' selected' : '') + '>/' + p + '（' + [m >>> 24, (m >>> 16) & 255, (m >>> 8) & 255, m & 255].join('.') + '）</option>'; }
    sel.innerHTML = h;
  }
  ntSubnetCalc();
}
function ntV4s(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
function ntSubnetCalc() {
  var out = ntEl('snOut');
  if (!out) return;
  var raw = ntVal('snIp').trim();
  var pfxSel = ntEl('snPfx');
  var m = raw.match(/^(.+?)\s*(?:\/\s*(\d{1,3})|\s+(\d+\.\d+\.\d+\.\d+))$/);
  var ip = m ? m[1] : raw, p = null;
  if (m && m[2] != null) p = +m[2];
  if (m && m[3]) {
    var mo = ntV4(m[3]);
    if (mo) { var mn = ((mo[0] << 24) >>> 0) + (mo[1] << 16) + (mo[2] << 8) + mo[3]; var bits = mn.toString(2).padStart(32, '0'); if (/^1*0*$/.test(bits)) p = bits.indexOf('0') < 0 ? 32 : bits.indexOf('0'); else { out.innerHTML = ntErr('サブネットマスクが正しくありません（1が左側に連続している必要があります）。'); return; } }
  }
  var o = ntV4(ip), g = o ? null : ntV6(ip);
  if (!o && !g) { out.innerHTML = raw ? ntErr('IPアドレスを正しく入力してください（例: 192.168.1.10/24、2001:db8::1/64）。') : ''; return; }
  if (pfxSel) pfxSel.disabled = !!g;
  if (o) {
    if (p == null) p = +(pfxSel ? pfxSel.value : 24); else if (pfxSel && p >= 1 && p <= 32) pfxSel.value = p;
    if (!(p >= 0 && p <= 32)) { out.innerHTML = ntErr('IPv4のプレフィックス長は0〜32です。'); return; }
    var n = ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
    var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
    var net = (n & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
    var total = Math.pow(2, 32 - p);
    var first = p >= 31 ? net : net + 1, last = p >= 31 ? bc : bc - 1;
    var hosts = p === 32 ? 1 : p === 31 ? 2 : total - 2;
    var binFix = function (x) { var s = x.toString(2).padStart(32, '0'); var parts = s.match(/.{8}/g).join('.'); var cut = p + Math.floor(Math.max(p - 1, 0) / 8); return '<b>' + parts.slice(0, cut) + '</b>' + parts.slice(cut); };
    var typ = ntV4Type(o);
    out.innerHTML = '<div class="result-area visible"><div class="result-grid">' +
      '<div class="result-item"><div class="result-label">ネットワークアドレス</div><div class="result-value" style="font-size:1.05rem;font-family:monospace">' + ntV4s(net) + '/' + p + '</div></div>' +
      '<div class="result-item"><div class="result-label">ブロードキャスト</div><div class="result-value" style="font-size:1.05rem;font-family:monospace">' + (p >= 31 ? '—' : ntV4s(bc)) + '</div></div>' +
      '<div class="result-item span2"><div class="result-label">使えるホストの範囲</div><div class="result-value" style="font-size:1.05rem;font-family:monospace">' + ntV4s(first) + ' 〜 ' + ntV4s(last) + '</div></div>' +
      '<div class="result-item"><div class="result-label">使えるホスト数</div><div class="result-value">' + hosts.toLocaleString() + '<span class="unit">台</span></div></div>' +
      '<div class="result-item"><div class="result-label">アドレス総数</div><div class="result-value">' + total.toLocaleString() + '<span class="unit">個</span></div></div>' +
      '</div></div>' +
      ntCard('詳細', '', '<div class="nt-tblwrap"><table class="nt-tbl">' +
        '<tr><th>サブネットマスク</th><td>' + ntV4s(mask) + '</td></tr>' +
        '<tr><th>ワイルドカードマスク</th><td>' + ntV4s((~mask) >>> 0) + '</td></tr>' +
        '<tr><th>アドレスの種類</th><td>' + typ[1] + '</td></tr>' +
        '<tr><th>IPアドレス（2進数）</th><td class="nt-bin" style="font-family:monospace">' + binFix(n) + '</td></tr>' +
        '<tr><th>マスク（2進数）</th><td class="nt-bin" style="font-family:monospace">' + binFix(mask) + '</td></tr>' +
        '<tr><th>IPアドレス（10進数）</th><td>' + n + '</td></tr>' +
        '<tr><th>IPアドレス（16進数）</th><td>0x' + ('0000000' + n.toString(16).toUpperCase()).slice(-8) + '</td></tr>' +
        '</table></div><div class="nt-note">太字がネットワーク部（プレフィックス長' + p + 'ビット）、残りがホスト部です。/31は2台を直結する回線用（RFC 3021）で、ネットワーク・ブロードキャストの区別がありません。</div>');
  } else {
    if (p == null) p = 64;
    if (!(p >= 0 && p <= 128)) { out.innerHTML = ntErr('IPv6のプレフィックス長は0〜128です。'); return; }
    var big = g.reduce(function (acc, x) { return (acc << 16n) + BigInt(x); }, 0n);
    var maskB = p === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - p)) - 1n);
    var netB = big & maskB, lastB = netB | (((1n << 128n) - 1n) ^ maskB);
    var toG = function (b) { var r = []; for (var i = 7; i >= 0; i--) r.push(Number((b >> BigInt(i * 16)) & 0xffffn)); return r; };
    var cnt = 1n << BigInt(128 - p);
    var cntStr = 128 - p <= 64 ? cnt.toLocaleString() : '2の' + (128 - p) + '乗（約' + Number(cnt).toExponential(2).replace('e+', '×10^') + '）';
    out.innerHTML = ntCard('IPv6 ' + ntEsc(ntV6Str(g)) + '/' + p, '', '<div class="nt-tblwrap"><table class="nt-tbl">' +
      '<tr><th>ネットワーク</th><td style="font-family:monospace">' + ntV6Str(toG(netB)) + '/' + p + '</td></tr>' +
      '<tr><th>範囲の先頭</th><td style="font-family:monospace">' + ntV6Full(toG(netB)) + '</td></tr>' +
      '<tr><th>範囲の末尾</th><td style="font-family:monospace">' + ntV6Full(toG(lastB)) + '</td></tr>' +
      '<tr><th>アドレス数</th><td>' + cntStr + '</td></tr>' +
      '<tr><th>種類</th><td>' + ntV6Type(g)[1] + '</td></tr>' +
      '</table></div><div class="nt-note">家庭や企業のLANは通常/64単位で、プロバイダからは/48〜/64が割り当てられます。IPv6にはブロードキャストアドレスはありません。</div>');
  }
}

/* ════ 6. ドメイン情報検索（RDAP） ════ */
var NT_RDAP_STATUS = { 'client transfer prohibited': '移管ロック（登録者側）', 'server transfer prohibited': '移管ロック（レジストリ側）', 'client delete prohibited': '削除ロック（登録者側）', 'server delete prohibited': '削除ロック（レジストリ側）', 'client update prohibited': '変更ロック（登録者側）', 'server update prohibited': '変更ロック（レジストリ側）', 'client hold': '停止中（登録者側）', 'server hold': '停止中（レジストリ側）', 'redemption period': '削除後の回復期間', 'pending delete': '削除待ち', 'active': '有効', 'auto renew period': '自動更新の猶予期間' };
async function ntWhois() {
  var out = ntEl('whOut'), btn = ntEl('whBtn');
  var d0 = ntDomain(ntVal('whQ'));
  if (!ntIsDomain(d0)) { out.innerHTML = ntErr('ドメイン名を正しく入力してください（例: example.com）。'); return; }
  var d = ntOrgDomain(d0);
  var tld = d.split('.').pop();
  btn.disabled = true;
  out.innerHTML = ntLoading(d + ' の登録情報を調べています…');
  try {
    var r = await ntFetchT('https://rdap.org/domain/' + encodeURIComponent(d), {}, 20000);
    if (r.status === 404) {
      out.innerHTML = ntErr(tld === 'jp'
        ? '.jpドメインは、管理団体のJPRSがRDAP（この検索の仕組み）に対応していないため、ここでは調べられません。<a href="https://whois.jprs.jp/" target="_blank" rel="noopener">JPRS WHOIS</a>で確認できます。'
        : ntEsc(d) + ' の登録情報が見つかりません。まだ登録されていないドメインか、このトップレベルドメイン（.' + ntEsc(tld) + '）がRDAPに対応していない可能性があります。');
      return;
    }
    if (!r.ok) throw new Error('登録情報サービスがエラーを返しました（HTTP ' + r.status + '）。時間をおいて再実行してください。');
    var j = await r.json();
    var ev = {}; (j.events || []).forEach(function (e) { ev[e.eventAction] = e.eventDate; });
    var registrar = '';
    (j.entities || []).forEach(function (e) {
      if ((e.roles || []).indexOf('registrar') >= 0) { var fn = ((e.vcardArray || [])[1] || []).filter(function (v) { return v[0] === 'fn'; })[0]; registrar = fn ? fn[3] : (e.handle || ''); }
    });
    var ns = (j.nameservers || []).map(function (n) { return String(n.ldhName || '').toLowerCase(); }).filter(Boolean);
    var exp = ev.expiration, left = exp ? ntDaysLeft(exp) : null;
    var expBadge = left == null ? '' : left < 0 ? ntBadge('ng', '期限切れ') : left < 30 ? ntBadge('ng', 'あと' + left + '日') : left < 90 ? ntBadge('warn', 'あと' + left + '日') : ntBadge('ok', 'あと' + left + '日');
    var st = (j.status || []).map(function (s) { return ntEsc(s) + (NT_RDAP_STATUS[s] ? '（' + NT_RDAP_STATUS[s] + '）' : ''); });
    var dnssec = j.secureDNS ? (j.secureDNS.delegationSigned ? ntBadge('ok', '署名あり') : ntBadge('info', 'なし')) : '—';
    out.innerHTML = (d !== d0 ? '<div class="nt-note">サブドメインのため、登録単位の ' + ntEsc(d) + ' で調べました。</div>' : '') +
      ntCard(ntEsc(String(j.ldhName || d).toLowerCase()), expBadge, '<div class="nt-tblwrap"><table class="nt-tbl">' +
        '<tr><th>登録日</th><td>' + ntDate(ev.registration) + '</td></tr>' +
        '<tr><th>有効期限</th><td>' + ntDate(exp) + ' ' + expBadge + '</td></tr>' +
        '<tr><th>最終更新</th><td>' + ntDate(ev['last changed']) + '</td></tr>' +
        (ev.registration ? '<tr><th>ドメイン年齢</th><td>' + (function () { var days = -ntDaysLeft(ev.registration); return Math.floor(days / 365.25) + '年' + Math.floor((days % 365.25) / 30.44) + 'か月（' + days.toLocaleString() + '日）'; })() + '</td></tr>' : '') +
        '<tr><th>レジストラ</th><td>' + ntEsc(registrar || '—') + '</td></tr>' +
        '<tr><th>ネームサーバー</th><td>' + (ns.length ? ns.map(ntEsc).join('<br>') : '—') + '</td></tr>' +
        '<tr><th>状態</th><td>' + (st.length ? st.join('<br>') : '—') + '</td></tr>' +
        '<tr><th>DNSSEC</th><td>' + dnssec + '</td></tr>' +
        '</table></div>') +
      '<div class="nt-note">RDAP（WHOISの後継となる登録情報の仕組み）から、rdap.org経由で取得しています。登録者の氏名・住所は、個人情報保護のため多くのドメインで非公開です。</div>';
  } catch (e) { out.innerHTML = ntErr(ntEsc(e.name === 'AbortError' ? '応答がありませんでした。時間をおいて再実行してください。' : e.message)); }
  finally { btn.disabled = false; }
}

/* ════ 7. SSL証明書チェック（CTログ） ════ */
function ntDnField(dn, key) { var m = String(dn || '').match(new RegExp('(?:^|,\\s*)' + key + '=("[^"]*"|[^,]*)')); return m ? m[1].replace(/^"|"$/g, '') : ''; }
function ntCertCovers(names, host) {
  return names.some(function (n) { n = n.toLowerCase(); if (n === host) return true; if (n.indexOf('*.') === 0) { var rest = host.slice(host.indexOf('.') + 1); return n.slice(2) === rest; } return false; });
}
async function ntSslCt() {
  var out = ntEl('scOut'), btn = ntEl('scBtn');
  var d = ntDomain(ntVal('scQ'));
  if (!ntIsDomain(d)) { out.innerHTML = ntErr('ドメイン名を正しく入力してください（例: example.com、www.example.com）。'); return; }
  btn.disabled = true;
  out.innerHTML = ntLoading(d + ' の証明書を公開ログ（CTログ）から探しています…（10〜30秒かかることがあります）');
  try {
    var qs = [d];
    if (d.split('.').length > 2) qs.push('*.' + d.slice(d.indexOf('.') + 1));
    var lists = await Promise.all(qs.map(function (q) {
      return ntFetchT('https://crt.sh/?q=' + encodeURIComponent(q) + '&output=json&exclude=expired', {}, 45000).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }));
    var bySerial = {};
    [].concat.apply([], lists).forEach(function (c) {
      var names = String(c.name_value || '').split('\n').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
      if (!ntCertCovers(names, d)) return;
      var k = c.serial_number + '|' + c.issuer_ca_id;
      if (!bySerial[k]) bySerial[k] = { issuer: c.issuer_name, from: c.not_before + 'Z', to: c.not_after + 'Z', names: names, id: c.id, cn: c.common_name };
    });
    var certs = Object.keys(bySerial).map(function (k) { return bySerial[k]; }).filter(function (c) { return new Date(c.to) > new Date() && new Date(c.from) <= new Date(); }).sort(function (a, b) { return new Date(b.from) - new Date(a.from); });
    if (!certs.length) { out.innerHTML = ntErr(ntEsc(d) + ' を対象にした有効な証明書が、CTログに見つかりませんでした。HTTPSを使っていないか、発行から数時間以内で、まだログに反映されていない可能性があります。'); return; }
    var c = certs[0], left = ntDaysLeft(c.to), span = Math.round((new Date(c.to) - new Date(c.from)) / 86400000);
    var badge = left < 7 ? ntBadge('ng', 'あと' + left + '日') : left < 21 ? ntBadge('warn', 'あと' + left + '日') : ntBadge('ok', 'あと' + left + '日');
    var org = ntDnField(c.issuer, 'O'), icn = ntDnField(c.issuer, 'CN');
    var html = ntCard('最新の証明書', badge, '<div class="nt-tblwrap"><table class="nt-tbl">' +
      '<tr><th>発行元（認証局）</th><td>' + ntEsc(org || '—') + (icn ? '（' + ntEsc(icn) + '）' : '') + '</td></tr>' +
      '<tr><th>有効期間の開始</th><td>' + ntDate(c.from) + '</td></tr>' +
      '<tr><th>有効期限</th><td>' + ntDate(c.to) + ' ' + badge + '</td></tr>' +
      '<tr><th>有効期間の長さ</th><td>' + span + '日</td></tr>' +
      '<tr><th>対象のドメイン（SAN）</th><td>' + c.names.slice(0, 30).map(ntEsc).join('<br>') + (c.names.length > 30 ? '<br>…ほか' + (c.names.length - 30) + '件' : '') + '</td></tr>' +
      '<tr><th>詳細</th><td><a href="https://crt.sh/?id=' + encodeURIComponent(c.id) + '" target="_blank" rel="noopener">crt.shで見る</a></td></tr>' +
      '</table></div>');
    if (certs.length > 1) {
      html += ntCard('現在有効な証明書（' + certs.length + '件）', '', '<div class="nt-tblwrap"><table class="nt-tbl"><tr><th>発行日</th><th>有効期限</th><th>発行元</th></tr>' +
        certs.slice(0, 15).map(function (x) { return '<tr><td>' + ntDate(x.from).replace('（日本時間）', '') + '</td><td>' + ntDate(x.to).replace('（日本時間）', '') + '</td><td>' + ntEsc(ntDnField(x.issuer, 'O') || ntDnField(x.issuer, 'CN')) + '</td></tr>'; }).join('') + '</table></div>' +
        '<div class="nt-note">自動更新では、古い証明書の期限が切れる前に新しい証明書が発行されるため、複数件が同時に有効になります。</div>');
    }
    html += '<div class="nt-note">証明書の公開ログ（Certificate Transparency）を crt.sh 経由で検索した結果です。発行された証明書の記録であり、サーバーが今実際に使っている証明書とは限りません（更新後にサーバーへの反映を忘れている場合など）。ブラウザのアドレスバーの鍵マークからも、使用中の証明書を確認できます。</div>';
    out.innerHTML = html;
  } catch (e) {
    out.innerHTML = ntErr(e.name === 'AbortError' ? '検索に時間がかかりすぎたため中断しました。crt.sh（外部サービス）が混み合っている可能性があります。時間をおいて再実行してください。' : 'crt.sh（外部サービス）から結果を受け取れませんでした（' + ntEsc(e.message) + '）。混み合っていることが多いため、時間をおいて再実行してください。');
  } finally { btn.disabled = false; }
}

/* ════ 8. 日本語ドメイン変換（Punycode） ════ */
function ntPcDecode(input) {
  var n = 128, i = 0, bias = 72, out = [];
  var b = input.lastIndexOf('-');
  if (b < 0) b = 0;
  for (var j = 0; j < b; j++) { if (input.charCodeAt(j) >= 128) throw new Error('bad'); out.push(input.charCodeAt(j)); }
  var adapt = function (delta, num, first) { delta = first ? Math.floor(delta / 700) : delta >> 1; delta += Math.floor(delta / num); var k = 0; while (delta > 455) { delta = Math.floor(delta / 35); k += 36; } return k + Math.floor(36 * delta / (delta + 38)); };
  for (var idx = b > 0 ? b + 1 : 0; idx < input.length;) {
    var oldi = i, w = 1;
    for (var k = 36; ; k += 36) {
      if (idx >= input.length) throw new Error('bad');
      var c = input.charCodeAt(idx++);
      var dg = c >= 48 && c <= 57 ? c - 22 : c >= 65 && c <= 90 ? c - 65 : c >= 97 && c <= 122 ? c - 97 : 36;
      if (dg >= 36) throw new Error('bad');
      i += dg * w;
      var t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
      if (dg < t) break;
      w *= 36 - t;
    }
    bias = adapt(i - oldi, out.length + 1, oldi === 0);
    n += Math.floor(i / (out.length + 1));
    i %= out.length + 1;
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint.apply(null, out);
}
function ntToUnicode(host) {
  return host.split('.').map(function (l) { if (/^xn--/i.test(l)) { try { return ntPcDecode(l.slice(4).toLowerCase()); } catch (e) { return l; } } return l; }).join('.');
}
function ntPunyCalc() {
  var out = ntEl('pcOut');
  if (!out) return;
  var raw = ntVal('pcIn').trim();
  if (!raw) { out.innerHTML = ''; return; }
  var host = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/^[^@\s\/]*@/, '').split(/[\/?#\s]/)[0].replace(/\.$/, '');
  var ascii = /[^\x00-\x7f]/.test(host) ? ntToAscii(host) : host.toLowerCase();
  if (/[^\x00-\x7f]/.test(ascii) || !ascii) { out.innerHTML = ntErr('ドメイン名として変換できない文字が含まれています。'); return; }
  var uni = ntToUnicode(ascii);
  var labels = ascii.split('.');
  out.innerHTML = '<div class="result-area visible"><div class="result-grid">' +
    '<div class="result-item span2"><div class="result-label">Punycode（xn--表記・DNSで使われる形）</div><div class="result-value" style="font-size:1rem;font-family:monospace;word-break:break-all" id="pcAscii">' + ntEsc(ascii) + '</div></div>' +
    '<div class="result-item span2"><div class="result-label">日本語表記（Unicode）</div><div class="result-value" style="font-size:1rem;word-break:break-all" id="pcUni">' + ntEsc(uni) + '</div></div>' +
    '</div></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px"><button class="nt-btn" style="padding:5px 12px;font-size:.75rem" onclick="navigator.clipboard&&navigator.clipboard.writeText(ntEl(\'pcAscii\').textContent)">Punycodeをコピー</button><button class="nt-btn" style="padding:5px 12px;font-size:.75rem" onclick="navigator.clipboard&&navigator.clipboard.writeText(ntEl(\'pcUni\').textContent)">日本語表記をコピー</button></div>' +
    (labels.length > 1 ? ntCard('ラベルごとの変換', '', '<div class="nt-tblwrap"><table class="nt-tbl"><tr><th>日本語表記</th><th>Punycode</th></tr>' + labels.map(function (l) { return '<tr><td>' + ntEsc(ntToUnicode(l)) + '</td><td style="font-family:monospace">' + ntEsc(l) + '</td></tr>'; }).join('') + '</table></div>') : '') +
    (host !== uni && /[Ａ-Ｚａ-ｚ０-９]/.test(host) ? '<div class="nt-note">全角英数字は半角に、英大文字は小文字に正規化されます（IDNAの規則）。</div>' : '');
}

/* ── 描画 ── */
var NT_IN = 'style="font-family:monospace"';
Object.assign(RENDERERS, {
  'mail-auth': function () { return '<div class="tool-input-row"><label>ドメイン（メールアドレスでも可）</label><div class="nt-row"><input id="maDomain" type="text" placeholder="example.com" ' + NT_IN + ' onkeydown="if(event.key===\'Enter\')ntMailAuth()"><button class="nt-btn" id="maBtn" onclick="ntMailAuth()">チェック</button></div></div><div class="tool-input-row"><label>DKIMセレクタ（任意）</label><input id="maSel" type="text" placeholder="空欄なら主要なセレクタを自動で探します（例: google、selector1）" onkeydown="if(event.key===\'Enter\')ntMailAuth()"></div><div id="maOut" class="nt-out"></div>'; },
  'dns-lookup': function () { return '<div class="tool-input-row"><label>ドメイン名またはIPアドレス</label><div class="nt-row"><input id="dlName" type="text" placeholder="example.com／8.8.8.8" ' + NT_IN + ' onkeydown="if(event.key===\'Enter\')ntDnsLookup()"><button class="nt-btn" id="dlBtn" onclick="ntDnsLookup()">検索</button></div></div><div class="tool-input-pair"><div class="tool-input-row"><label>レコードの種類</label><select id="dlType"><option value="ALL">主要なレコードをすべて</option><option>A</option><option>AAAA</option><option>CNAME</option><option>MX</option><option>NS</option><option>TXT</option><option>SOA</option><option>CAA</option><option>SRV</option></select></div><div class="tool-input-row"><label>DNSサーバー</label><select id="dlRes"><option value="cloudflare">Cloudflare（1.1.1.1）</option><option value="google">Google（8.8.8.8）</option></select></div></div><div id="dlOut" class="nt-out"></div>'; },
  'my-ip': function () { return '<div id="miOut" class="nt-out" style="margin-top:0"></div><button class="nt-btn" onclick="ntMyIp()" style="margin-top:4px">再取得</button>'; },
  'ip-info': function () { return '<div class="tool-input-row"><label>IPアドレスまたはホスト名</label><div class="nt-row"><input id="iiQ" type="text" placeholder="8.8.8.8／2001:4860:4860::8888／example.com" ' + NT_IN + ' onkeydown="if(event.key===\'Enter\')ntIpInfo()"><button class="nt-btn" id="iiBtn" onclick="ntIpInfo()">調べる</button></div></div><div id="iiOut" class="nt-out"></div>'; },
  'subnet': function () { return '<div class="tool-input-pair"><div class="tool-input-row"><label>IPアドレス（/CIDRも可）</label><input id="snIp" type="text" value="192.168.1.10/24" ' + NT_IN + ' oninput="ntSubnetCalc()"></div><div class="tool-input-row"><label>プレフィックス長（サブネットマスク）</label><select id="snPfx" onchange="var i=ntEl(\'snIp\');i.value=i.value.replace(/\\s*\\/.*$|\\s+\\d+\\.\\d+\\.\\d+\\.\\d+$/,\'\')+\'/\'+this.value;ntSubnetCalc()"></select></div></div><div id="snOut"></div>'; },
  'whois': function () { return '<div class="tool-input-row"><label>ドメイン名</label><div class="nt-row"><input id="whQ" type="text" placeholder="example.com" ' + NT_IN + ' onkeydown="if(event.key===\'Enter\')ntWhois()"><button class="nt-btn" id="whBtn" onclick="ntWhois()">調べる</button></div></div><div id="whOut" class="nt-out"></div>'; },
  'ssl-ct': function () { return '<div class="tool-input-row"><label>ドメイン名（https:// から貼り付けても可）</label><div class="nt-row"><input id="scQ" type="text" placeholder="www.example.com" ' + NT_IN + ' onkeydown="if(event.key===\'Enter\')ntSslCt()"><button class="nt-btn" id="scBtn" onclick="ntSslCt()">チェック</button></div></div><div id="scOut" class="nt-out"></div>'; },
  'punycode': function () { return '<div class="tool-input-row"><label>日本語ドメイン、またはxn--で始まるドメイン</label><input id="pcIn" type="text" value="日本語.jp" oninput="ntPunyCalc()"></div><div id="pcOut"></div>'; }
});

var NT_RUN = { 'mail-auth': ['maDomain', ntMailAuth], 'dns-lookup': ['dlName', ntDnsLookup], 'ip-info': ['iiQ', ntIpInfo], 'whois': ['whQ', ntWhois], 'ssl-ct': ['scQ', ntSslCt], 'subnet': ['snIp', null], 'punycode': ['pcIn', null] };
var NET_INIT = { 'my-ip': ntMyIp, 'subnet': ntSubnetInit, 'punycode': ntPunyCalc };
(function () {
  var orig = window.initTool;
  window.initTool = function (id) {
    if (orig) orig(id);
    var q = null;
    try { q = new URLSearchParams(location.search).get('q'); } catch (e) { }
    if (q && NT_RUN[id] && ntEl(NT_RUN[id][0])) ntEl(NT_RUN[id][0]).value = q.slice(0, 300);
    if (NET_INIT[id]) NET_INIT[id]();
    if (q && NT_RUN[id] && NT_RUN[id][1]) NT_RUN[id][1]();
  };
})();
