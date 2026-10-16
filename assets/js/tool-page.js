document.addEventListener('DOMContentLoaded', function () {
  var id = document.body.dataset.tool;
  var tool = TOOLS.find(function (t) { return t.id === id; });
  if (!tool) return;
  var render = RENDERERS[id] || function () { return RENDERERS.default(tool); };
  document.getElementById('toolBody').innerHTML = render(tool);
  var ads = renderAds(id);
  if (ads) {
    var adsEl = document.getElementById('toolAds');
    adsEl.innerHTML = ads;
    adsEl.style.display = 'block';
  }
  activeToolId = id;
  initTool(id);
});
