export function resolveTagManagerId(value: string | undefined): string {
  const id = (value || "").trim();
  if (id && !/^GTM-[A-Z0-9]{4,20}$/.test(id)) {
    throw new Error(
      "VITE_GTM_ID must be a Google Tag Manager container ID starting with GTM-. Leave it blank to disable tracking.",
    );
  }
  return id;
}

export function stripTagManager(html: string): string {
  return html
    .replace(/<script\b[^>]*data-portfolio-gtm[^>]*>[\s\S]*?<\/script>\s*/g, "")
    .replace(
      /<noscript\b[^>]*data-portfolio-gtm[^>]*>[\s\S]*?<\/noscript>\s*/g,
      "",
    );
}

export function injectTagManager(html: string, containerId = ""): string {
  const clean = stripTagManager(html);
  const tagManagerId = resolveTagManagerId(containerId);
  if (!tagManagerId) return clean;
  const loader = `<script data-portfolio-gtm>
(function(w,d,s,l,i){
  if(!/^(www\\.)?adeshgupta\\.site$/.test(w.location.hostname) ||
     w.location.pathname!=='/' ||
     new URLSearchParams(w.location.search).has('admin-preview') ||
     w.self!==w.top || w.__portfolioGtmLoaded) return;
  w.__portfolioGtmLoaded=true;
  w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
  j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${tagManagerId}');
</script>`;
  const fallback = `<noscript data-portfolio-gtm><iframe src="https://www.googletagmanager.com/ns.html?id=${tagManagerId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager" aria-hidden="true" tabindex="-1"></iframe></noscript>`;
  // Keep the charset first, with the container loader high in the document.
  const head = /<meta\b[^>]*charset=[^>]+>/i;
  const result = head.test(clean)
    ? clean.replace(head, (match) => `${match}\n${loader}`)
    : clean.replace(/<head\b[^>]*>/i, (match) => `${match}\n${loader}`);
  return result.replace(/<body\b[^>]*>/i, (match) => `${match}\n${fallback}`);
}
