// Demo only. Answers fetch('<path>?format=json[&offset=…]') the way Squarespace does, from window.DEMO_DATA:
//   { '/team-members': { type: 'blog', collection: {...}, items: [...] },
//     '/events': { type: 'events', collection: {...}, upcoming: [...], past: [...] } }
// Blogs page 20 items at a time with an offset cursor. Everything else goes to the network.
// The site title is the demo's <html data-demo-org>, or Harbourlight Church when a demo doesn't set one.
(function () {
  var real = window.fetch.bind(window), site = document.documentElement.getAttribute('data-demo-org') || 'Harbourlight Church';
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;
    var u = new URL(url, location.href), data = (window.DEMO_DATA || {})[u.pathname];
    if (!data || u.searchParams.get('format') !== 'json') return real(input, init);
    var body;
    if (data.type === 'events') {
      body = { website: { siteTitle: site, timeZone: 'Pacific/Auckland' }, collection: data.collection, upcoming: data.upcoming || [], past: data.past || [] };
    } else {
      var before = +u.searchParams.get('offset') || Infinity;
      var rest = data.items.filter(function (i) { return i.publishOn < before; });
      var page = rest.slice(0, 20), more = rest.length > 20, last = page[page.length - 1];
      body = {
        website: { siteTitle: site, timeZone: 'Pacific/Auckland' }, collection: data.collection, items: page,
        pagination: more ? { nextPage: true, nextPageOffset: last.publishOn, nextPageUrl: u.pathname + '?offset=' + last.publishOn, pageSize: 20 } : { nextPage: false, pageSize: 20 }
      };
    }
    var delay = 160 + Math.random() * 240;
    return new Promise(function (ok) {
      setTimeout(function () { ok(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })); }, delay);
    });
  };
})();
