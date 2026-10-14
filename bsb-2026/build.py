#!/usr/bin/env python3
"""Build the optimised /bsb-2026/ pages.

Edit the SOURCES in src/ (index.html, style.css, premium.css, main.js) and run:   python3 build.py

Outputs (these are what GitHub Pages serves — do not edit by hand):
  index.html    classic navy theme      (css = src/style.css)
  premium.html  premium ivory/gold      (css = src/premium.css)
  js/main.js    minified script
  et.html       premium theme + the ET-only first screen for the article's QR code (src/et-hero.html, src/et-walk.html)
  thank-you-premium.html + js/thankyou.js   post-payment page (src/thank-you.html, src/ty-premium.css, src/thankyou.js)
Footer business details (legal name, address, phone, GST, Terms/Privacy links) come from src/business.json — empty values are not shown.

What the build does for speed:
  * minifies the CSS and inlines it in <head> (no render-blocking stylesheet request)
  * preloads the above-the-fold fonts and the hero image, modulepreloads the scripts
  * adds width/height + decoding="async" to every <img> (no layout shift)
  * strips comments / indentation from the HTML
Needs: python3 + Pillow, and node (uses `npx esbuild` for minification; falls back to unminified if unavailable).
"""
import hashlib, html as htmllib, json, os, re, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(ROOT, *a)

def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

def esbuild(source, loader):
    """Minify via esbuild; fall back to the untouched source if node/esbuild is unavailable."""
    try:
        out = subprocess.run(
            ["npx", "--yes", "esbuild", "--minify", f"--loader={loader}"] + (["--target=es2020"] if loader == "js" else []),
            input=source, capture_output=True, text=True, cwd=ROOT, check=True,
        )
        return out.stdout
    except Exception as exc:  # pragma: no cover
        print("  ! esbuild unavailable, leaving", loader, "unminified:", exc, file=sys.stderr)
        return source

def min_html(s):
    s = re.sub(r"<!--(?!BUILD).*?-->", "", s, flags=re.S)
    s = re.sub(r"^[ \t]+", "", s, flags=re.M)
    s = re.sub(r"\n{2,}", "\n", s)
    return s.strip() + "\n"

def add_img_attrs(html, lcp_src):
    """width/height from the real files + decoding=async (LCP image excluded)."""
    def fix(m):
        tag = m.group(0)
        src = re.search(r'src="([^"#?]+)', tag)
        if not src or src.group(1).startswith(("http", "data:")):
            return tag
        path = P(src.group(1))
        if not os.path.exists(path):
            return tag
        if "width=" not in tag or "height=" not in tag:
            w, h = Image.open(path).size
            tag = re.sub(r'\s(?:width|height)="\d+"', "", tag)
            tag = tag.replace("<img ", f'<img width="{w}" height="{h}" ', 1)
        if "decoding=" not in tag and src.group(1) != lcp_src:
            tag = tag.replace("<img ", '<img decoding="async" ', 1)
        return tag
    return re.sub(r"<img\b[^>]*>", fix, html)

# ----------------------------------------------------------------------------------------------
ARTICLE_TITLE = "Building self-reliant teams"      # page title = the printed article headline (ET Panache)
TITLE_MAIN = "<title>Business Scale-Up Blueprint — Mumbai, 1 Nov 2026</title>"
H1_MAIN = '<h1>Scale Your Business<br><span class="blue">Without Working Everything Yourself</span></h1>'
H1_PREMIUM = ('<h1>Building <span class="nb">Self-Reliant</span> Teams</h1>\n        '
              '<p class="hero-deck">Teams follow up on their own when ownership is clear, says business coach Ameet Parekh</p>')   # headline as printed in the ET Panache feature

PREMIUM_COMMON = [
    ("assets/coach-portrait.webp", "assets/coach-portrait-premium.webp"),
    # theme-aware icon details (the default white keeps them unchanged in the classic theme)
    ('<circle cx="12" cy="9.5" r="2.6" fill="#fff"/>', '<circle cx="12" cy="9.5" r="2.6" style="fill:var(--ic-in,#fff)"/>'),
    ('<path d="M3 9.5h18" stroke="#fff" stroke-width="1.6"/>', '<path d="M3 9.5h18" stroke-width="1.6" style="stroke:var(--ic-in,#fff)"/>'),
    ('<g fill="#fff"><rect x="6.5" y="12"', '<g style="fill:var(--ic-in,#fff)"><rect x="6.5" y="12"'),
    ('<circle cx="14" cy="5.6" r="3" fill="#fff"/>', '<circle cx="14" cy="5.6" r="3" style="fill:var(--ic-in,#fff)"/>'),
    ('<path d="M6.5 12.4l3.6 3.6 7.4-8" fill="none" stroke="#fff" stroke-width="2.6"', '<path d="M6.5 12.4l3.6 3.6 7.4-8" fill="none" stroke-width="2.6" style="stroke:var(--ic-in,#fff)"'),
]
PREMIUM_FONTS = ["playfair-var.woff2", "playfair-italic-var.woff2", "manrope-var.woff2"]

def et_transform(html):
    """The article's QR code lands here: same page, but a different first screen (see the change doc, 'New ET-only first screen')."""
    a = html.index('<header class="hero" id="top">'); b = html.index("</header>", a) + len("</header>")
    html = html[:a] + read(P("src", "et-hero.html")).strip() + html[b:]
    assert html.count('<main id="main">') == 1
    html = html.replace('<main id="main">', '<main id="main">\n' + read(P("src", "et-walk.html")), 1)
    why = '<h2 class="h2 center">Why BSB?</h2>'
    assert html.count(why) == 1
    html = html.replace(why, why + '\n    <p class="why-quote">“I have to follow up on every single task myself.”</p>', 1)
    bar = re.search(r'<div class="m-bar".*?</div>', html, re.S).group(0)
    html = html.replace(bar, '<div class="m-bar et-bar" id="m-bar" aria-hidden="true"><span>₹1,499 · Sun 1 Nov</span><button class="btn" type="button" data-book tabindex="-1">Book my seat</button></div>', 1)
    html = html.replace("<body>", '<body data-utm-default="utm_source=et-panache&amp;utm_medium=print-qr&amp;utm_campaign=bsb-1nov-2026">', 1)
    assert html.count(TITLE_MAIN) == 1
    html = html.replace(TITLE_MAIN, f'<title>{ARTICLE_TITLE}</title>\n  <meta name="robots" content="noindex, follow">', 1)
    return html

THEMES = {
    "classic": dict(
        out="index.html", css="style.css",
        fonts=["roboto-var.woff2"], lcp="assets/coach-circle.webp", theme_color=None,
        renames=[],
    ),
    "premium": dict(
        out="premium.html", css="premium.css", fonts=PREMIUM_FONTS,
        lcp="assets/coach-circle-premium.webp", theme_color="#15112F",
        renames=[(H1_MAIN, H1_PREMIUM), (TITLE_MAIN, f"<title>{ARTICLE_TITLE}</title>"), ("assets/logo-light.webp", "assets/logo-ink.webp"),
                 ("assets/coach-circle.webp", "assets/coach-circle-premium.webp")] + PREMIUM_COMMON,
    ),
    "et": dict(
        out="et.html", css="premium.css", fonts=PREMIUM_FONTS,
        lcp="assets/coach-circle-premium-sm.webp", theme_color="#15112F",
        pre=et_transform, renames=PREMIUM_COMMON,
    ),
}

def business_html():
    """Footer business details from src/business.json; blank values are skipped (nothing invented)."""
    b = json.loads(read(P("src", "business.json")))
    esc = htmllib.escape
    rows = []
    if b.get("legal_name"): rows.append(f"<span><b>{esc(b['legal_name'])}</b></span>")
    if b.get("address"): rows.append(f"<span>{esc(b['address'])}</span>")
    if b.get("phone"):
        digits = re.sub(r"[^\d+]", "", b["phone"])
        rows.append(f'<span>WhatsApp / phone: <a href="tel:{digits}">{esc(b["phone"])}</a></span>')
    if b.get("gst"): rows.append(f"<span>GST: {esc(b['gst'])}</span>")
    links = []
    if b.get("terms_url"): links.append(f'<a href="{esc(b["terms_url"])}">Terms</a>')
    if b.get("privacy_url"): links.append(f'<a href="{esc(b["privacy_url"])}">Privacy</a>')
    if links: rows.append("<span>" + " · ".join(links) + "</span>")
    return ('<div class="biz">' + "".join(rows) + "</div>") if rows else ""

def main():
    base = read(P("src", "index.html"))

    js = esbuild(read(P("src", "main.js")), "js")
    write(P("js", "main.js"), js)
    jsv = hashlib.md5(js.encode()).hexdigest()[:8]
    config_url = re.search(r'from "((?:\.\./)+script/config\.js\?v=[^"]+)"', read(P("src", "main.js"))).group(1)
    config_href = config_url[3:]            # js/main.js lives one level down: ../../script -> ../script from the page
    print(f"js/main.js  {len(js)/1024:5.1f} KB  (v={jsv})")

    for name, t in THEMES.items():
        html = base
        if t.get("pre"):
            html = t["pre"](html)
        for old, new in t["renames"]:
            assert old in html, (name, old[:60])
            html = html.replace(old, new)
        assert "<!--BUILD:BUSINESS-->" in html
        html = html.replace("<!--BUILD:BUSINESS-->", business_html())
        css = esbuild(read(P("src", t["css"])), "css")
        preload = "".join(
            f'<link rel="preload" href="fonts/{f}" as="font" type="font/woff2" crossorigin>' for f in t["fonts"]
        )
        preload += f'<link rel="preload" href="{t["lcp"]}" as="image" type="image/webp" fetchpriority="high">'
        preload += f'<link rel="modulepreload" href="js/main.js?v={jsv}"><link rel="modulepreload" href="{config_href}">'
        if t["theme_color"]:
            preload = f'<meta name="theme-color" content="{t["theme_color"]}">' + preload
        head = preload + "<style>" + css + "</style>"
        assert "<!--BUILD:HEAD-->" in html
        html = html.replace("<!--BUILD:HEAD-->", head)
        html = re.sub(r"js/main\.js\?v=\w+\"></script>", f'js/main.js?v={jsv}"></script>', html)
        html = add_img_attrs(html, t["lcp"])
        html = min_html(html)
        write(P(t["out"]), html)
        print(f'{t["out"]:13} {len(html)/1024:5.1f} KB  (css inlined: {len(css)/1024:4.1f} KB)')

def build_thankyou():
    """Premium thank-you page: details form -> WhatsApp community, plus Save The Date."""
    js = esbuild(read(P("src", "thankyou.js")), "js")
    write(P("js", "thankyou.js"), js)
    jsv = hashlib.md5(js.encode()).hexdigest()[:8]
    config_url = re.search(r'from "((?:\.\./)+script/config\.js\?v=[^"]+)"', read(P("src", "thankyou.js"))).group(1)
    config_href = config_url[3:]
    css = esbuild(read(P("src", "ty-premium.css")), "css")
    fonts = ["playfair-var.woff2", "playfair-italic-var.woff2", "manrope-var.woff2"]
    head = '<meta name="theme-color" content="#15112F">'
    head += "".join(f'<link rel="preload" href="fonts/{f}" as="font" type="font/woff2" crossorigin>' for f in fonts)
    head += f'<link rel="modulepreload" href="js/thankyou.js?v={jsv}"><link rel="modulepreload" href="{config_href}">'
    head += "<style>" + css + "</style>"
    html = read(P("src", "thank-you.html"))
    assert "<!--BUILD:HEAD-->" in html
    html = html.replace("<!--BUILD:HEAD-->", head)
    html = re.sub(r"js/thankyou\.js\?v=\w+\"></script>", f'js/thankyou.js?v={jsv}"></script>', html)
    html = add_img_attrs(html, "")
    html = min_html(html)
    write(P("thank-you-premium.html"), html)
    print(f"js/thankyou.js {len(js)/1024:4.1f} KB  (v={jsv})")
    print(f"thank-you-premium.html {len(html)/1024:5.1f} KB  (css inlined: {len(css)/1024:4.1f} KB)")


if __name__ == "__main__":
    main()
    build_thankyou()
