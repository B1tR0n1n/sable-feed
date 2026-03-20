import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'outline',
});

export function parseOpml(xmlString) {
  const parsed = xmlParser.parse(xmlString);
  const body = parsed?.opml?.body;
  if (!body) throw new Error('Invalid OPML: missing body');

  const feeds = [];
  const outlines = Array.isArray(body.outline) ? body.outline : [body.outline];

  function walkOutlines(outlines, category) {
    for (const outline of outlines) {
      if (!outline) continue;

      // It's a feed
      if (outline['@_xmlUrl'] || outline['@_xmlurl']) {
        feeds.push({
          title: outline['@_title'] || outline['@_text'] || 'Untitled',
          url: outline['@_xmlUrl'] || outline['@_xmlurl'],
          site_url: outline['@_htmlUrl'] || outline['@_htmlurl'] || null,
          category: category || null,
        });
      }

      // It's a folder
      if (outline.outline) {
        const children = Array.isArray(outline.outline) ? outline.outline : [outline.outline];
        const cat = outline['@_title'] || outline['@_text'] || category;
        walkOutlines(children, cat);
      }
    }
  }

  walkOutlines(outlines, null);
  return feeds;
}

export function generateOpml(tiers, feeds) {
  const tiersMap = {};
  for (const tier of tiers) {
    tiersMap[tier.id] = { ...tier, feeds: [] };
  }
  for (const feed of feeds) {
    if (tiersMap[feed.tier_id]) {
      tiersMap[feed.tier_id].feeds.push(feed);
    }
  }

  const outlines = Object.values(tiersMap)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((tier) => ({
      '@_text': `${tier.label} — ${tier.title}`,
      '@_title': `${tier.label} — ${tier.title}`,
      outline: tier.feeds.map((f) => ({
        '@_type': 'rss',
        '@_text': f.title,
        '@_title': f.title,
        '@_xmlUrl': f.url,
        '@_htmlUrl': f.site_url || '',
      })),
    }));

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    suppressEmptyNode: true,
  });

  const opmlObj = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    opml: {
      '@_version': '2.0',
      head: {
        title: 'SABLE FEED — b1tr0n1n',
        dateCreated: new Date().toUTCString(),
      },
      body: {
        outline: outlines,
      },
    },
  };

  return builder.build(opmlObj);
}
