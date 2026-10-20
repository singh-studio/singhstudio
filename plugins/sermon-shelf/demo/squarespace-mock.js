// Demo only. Answers fetch('/sermons?format=json[&offset=…]') the way a Squarespace blog does,
// 20 items a page with an offset cursor, from window.DEMO_ARCHIVE. Everything else goes to the network.
(function () {
  var real = window.fetch.bind(window);
  var archive = window.DEMO_ARCHIVE;
  var src = archive.collection.fullUrl;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;
    var u = new URL(url, location.href);
    if (u.pathname !== src || u.searchParams.get('format') !== 'json') return real(input, init);
    var before = +u.searchParams.get('offset') || Infinity;
    var rest = archive.items.filter(function (i) { return i.publishOn < before; });
    var page = rest.slice(0, 20), more = rest.length > 20, last = page[page.length - 1];
    var body = {
      website: { siteTitle: 'Harbourlight Church' }, collection: archive.collection, items: page,
      pagination: more ? { nextPage: true, nextPageOffset: last.publishOn, nextPageUrl: src + '?offset=' + last.publishOn, pageSize: 20 } : { nextPage: false, pageSize: 20 }
    };
    var delay = 180 + Math.random() * 260;
    return new Promise(function (ok) {
      setTimeout(function () { ok(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })); }, delay);
    });
  };
})();
