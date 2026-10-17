document.addEventListener('DOMContentLoaded', function () {
  var id = document.body.dataset.tool;
  var tool = TOOLS.find(function (t) { return t.id === id; });
  if (!tool) return;
  var render = RENDERERS[id] || function () { return RENDERERS.default(tool); };
  document.getElementById('toolBody').innerHTML = render(tool);
  var embed = document.documentElement.classList.contains('tp-embed');
  var ads = embed ? '' : renderAds(id);
  if (ads) {
    var adsEl = document.getElementById('toolAds');
    adsEl.innerHTML = ads;
    adsEl.style.display = 'block';
  }
  activeToolId = id;
  initTool(id);
  if (embed && window.parent !== window) {
    var post = function () { window.parent.postMessage({ toolslabHeight: Math.ceil(document.documentElement.scrollHeight) }, '*'); };
    if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
    window.addEventListener('load', post);
    post();
  }
  var copyBtn = document.getElementById('embedCopy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var ta = document.getElementById('embedCode');
    var done = function () { var m = document.getElementById('embedCopied'); m.hidden = false; setTimeout(function () { m.hidden = true; }, 2000); };
    ta.select();
    if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand('copy'); done(); });
    else { document.execCommand('copy'); done(); }
  });
});
