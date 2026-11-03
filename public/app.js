/* Storefront behavior. Catalog data lives in products.js.
   Escape strings use unicode escapes so an HTML decoder cannot break them. */
(function () {
  "use strict";

  var catalog = window.XI_CATALOG;
  var app = document.querySelector("#app");
  var tabs = document.querySelector("#tabs");
  var PRODUCTS = [];
  var cart = [];
  var page = 1;
  var query = "";
  var priceBand = "";
  var versionFilter = "";
  var sizeFilter = "";
  var lastShopKey = "";
  var lastFocus = null;
  var sampleUnlocked = false;

  var CATEGORIES = [
    { id: "schematics", label: "Schematics", blurb: "Paste-ready builds in .schem and .litematic." },
    { id: "photos", label: "Photos", blurb: "4K shader screenshots for wallpapers and thumbnails." },
    { id: "packs", label: "Packs", blurb: "Texture packs and creator kits." },
    { id: "bundles", label: "Bundles", blurb: "A 3-for-2 schematic set and a starter kit." }
  ];

  var FAQ = [
    { q: "What file formats do you deliver?", a: "Schematics as .schem and .litematic. Photos as 4K PNG. Packs as listed on the product." },
    { q: "Do the builds work on my version?", a: "Most are tested on 1.20+. The product page lists every supported version. Map art starts at 1.19. The muted stone pack is Java 1.21." },
    { q: "How do I install a schematic?", a: "Litematica opens .litematic files. WorldEdit opens .schem files. The install guide walks through both." },
    { q: "Can I use these on a server?", a: "Personal use is fine, including a server you play on with friends. For a public or commercial server, contact me first." },
    { q: "Where is my download after payment?", a: "Stripe can send you back to a thank-you page for that product. The page lists the files. Until a file is uploaded, use Contact and I will send it." },
    { q: "How does the free sample work?", a: "Enter your email in the sample form. That signs you up for new-build notes and reveals the sample download." },
    { q: "What is the 3-for-2?", a: "The Schematic 3-for-2 is the castle, the stash hall, and the map-art pack. You pay for the two higher prices and the cheapest is included. It is its own Stripe Payment Link, not three separate charges." },
    { q: "What is the starter kit?", a: "The Builder Starter Kit is the spawn castle, the overworld ruins photos, and the muted stone pack, for less than buying them separately." },
    { q: "Are the star ratings real?", a: "No. Ratings on the site are placeholders so the layout is ready. They are labeled placeholder and are not customer reviews." },
    { q: "Refunds?", a: "Digital goods are final sale once downloaded. Contact me if a file is broken or missing." },
    { q: "Do photos or packs need a mod?", a: "No. Photos are PNG files. The texture pack is a normal resource pack. Only schematics need Litematica or WorldEdit." }
  ];

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      switch (ch) {
        case "\u0026":
          return "\u0026amp;";
        case "\u003c":
          return "\u0026lt;";
        case "\u003e":
          return "\u0026gt;";
        case "\u0022":
          return "\u0026quot;";
        default:
          return "\u0026#39;";
      }
    });
  }

  function hexColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  function artStyle(colors) {
    var a = hexColor(colors && colors[0], "#2b2140");
    var b = hexColor(colors && colors[1], "#6c4fb0");
    var c = hexColor(colors && colors[2], "#e0811b");
    return "background-color:" + a + ";background-image:" +
      "linear-gradient(150deg,transparent 0 36%," + c + " 36% 48%,transparent 48%)," +
      "linear-gradient(180deg,rgba(255,255,255,.16),transparent 42%)," +
      "repeating-linear-gradient(90deg," + a + " 0 20px," + b + " 20px 40px)," +
      "repeating-linear-gradient(0deg,transparent 0 19px,rgba(0,0,0,.28) 19px 20px)";
  }

  function money(amount, withCode) {
    var number = Number(amount);
    var safe = Number.isFinite(number) ? number : 0;
    var value = "$" + safe.toFixed(2);
    return withCode ? value + "\u00a0" + (catalog.currency || "USD") : value;
  }

  function productById(id) {
    for (var i = 0; i < PRODUCTS.length; i += 1) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i += 1) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function shopProducts() {
    return PRODUCTS.filter(function (product) { return !product.sample; });
  }

  function isBundle(product) {
    return product && (product.deal === "3-for-2" || product.deal === "starter-kit" || product.cat === "Bundles");
  }

  function dealLabel(product) {
    if (!product || !product.deal) return "";
    if (product.deal === "3-for-2") return "3 for 2";
    if (product.deal === "starter-kit") return "Starter kit";
    return product.deal;
  }

  function countIn(label) {
    var count = 0;
    shopProducts().forEach(function (product) {
      if (product.cat === label) count += 1;
    });
    return count;
  }

  function itemWord(count) {
    return count === 1 ? "item" : "items";
  }

  function safeAsset(value) {
    if (typeof value !== "string") return "";
    var trimmed = value.trim();
    if (!trimmed || trimmed.indexOf("..") !== -1) return "";
    if (/^(javascript|data):/i.test(trimmed)) return "";
    if (/^https:\/\//i.test(trimmed)) return trimmed;
    if (/^[\w./-]+$/.test(trimmed)) return trimmed;
    return "";
  }

  function youtubeId(value) {
    if (typeof value !== "string") return "";
    var trimmed = value.trim();
    return /^[A-Za-z0-9_-]{11}$/.test(trimmed) ? trimmed : "";
  }

  function checkoutUrl(id, email) {
    var product = productById(id);
    var raw = product && typeof product.stripePaymentLink === "string" ? product.stripePaymentLink : "";
    var trimmed = raw.trim();
    if (!trimmed) return "";
    var url;
    try {
      url = new URL(trimmed);
    } catch (error) {
      return "";
    }
    if (url.protocol !== "https:") return "";
    if (email) url.searchParams.set("prefilled_email", email);
    url.searchParams.set("client_reference_id", id);
    return url.toString();
  }

  function filesFor(product) {
    if (!product) return [];
    if (product.files && product.files.length) return product.files;
    if (!product.includes || !product.includes.length) return [];
    var all = [];
    product.includes.forEach(function (id) {
      var child = productById(id);
      if (child && child.files) all = all.concat(child.files);
    });
    return all;
  }

  function reviewsFor(id) {
    var list = catalog.reviews || [];
    if (!id) return list.slice();
    return list.filter(function (review) { return review.productId === id; });
  }

  function loadFlag(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  function saveFlag(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  }

  function loadCart() {
    try {
      var parsed = JSON.parse(localStorage.getItem("xi-cart") || "[]");
      if (!Array.isArray(parsed)) return [];
      var seen = {};
      var next = [];
      parsed.forEach(function (id) {
        if (productById(id) && !productById(id).sample && !seen[id]) {
          seen[id] = true;
          next.push(id);
        }
      });
      return next;
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem("xi-cart", JSON.stringify(cart));
    } catch (error) {}
  }

  function setCartMessage(text, kind) {
    var node = document.querySelector("#cart-msg");
    if (!node) return;
    node.textContent = text || "";
    node.className = "msg" + (kind ? " " + kind : "");
  }

  function syncAddButtons() {
    document.querySelectorAll(".add").forEach(function (button) {
      var inCart = cart.indexOf(button.getAttribute("data-id")) !== -1;
      button.setAttribute("aria-pressed", inCart ? "true" : "false");
      button.textContent = inCart ? "In cart" : "Add to cart";
    });
  }

  function includedSum(product) {
    var sum = 0;
    (product.includes || []).forEach(function (id) {
      var child = productById(id);
      if (child) sum += child.price;
    });
    return sum;
  }

  function bundleOffers() {
    return shopProducts().filter(function (product) {
      if (!isBundle(product) || !product.includes || !product.includes.length) return false;
      if (cart.indexOf(product.id) !== -1) return false;
      return product.includes.every(function (id) { return cart.indexOf(id) !== -1; });
    });
  }

  function updateBundleOffer() {
    var slot = document.querySelector("#bundle-offer");
    if (!slot) return;
    var offers = bundleOffers();
    if (!offers.length) {
      slot.innerHTML = "";
      return;
    }
    slot.innerHTML = offers.map(function (product) {
      var full = product.compareAt || includedSum(product);
      return '<div class="offer"><p><strong>' + esc(product.name) + '</strong> covers these items for ' +
        esc(money(product.price, true)) + " instead of " + esc(money(full, true)) + ".</p>" +
        '<button class="btn" type="button" data-bundle="' + esc(product.id) + '">Switch to this deal</button></div>';
    }).join("");
    slot.querySelectorAll("[data-bundle]").forEach(function (button) {
      button.addEventListener("click", function () {
        applyBundle(button.getAttribute("data-bundle"));
      });
    });
  }

  function applyBundle(id) {
    var product = productById(id);
    if (!product || !product.includes) return;
    cart = cart.filter(function (item) { return product.includes.indexOf(item) === -1; });
    if (cart.indexOf(id) === -1) cart.push(id);
    saveCart();
    updateCart();
    syncAddButtons();
    setCartMessage(product.name + " replaced the separate items. One Stripe link charges the deal price.", "");
  }

  function updateCart() {
    var count = document.querySelector("#count");
    var lines = document.querySelector("#lines");
    var total = document.querySelector("#total");
    var payBtn = document.querySelector("#pay-btn");
    var openBtn = document.querySelector("#open-cart");
    if (count) count.textContent = String(cart.length);
    if (openBtn) {
      openBtn.setAttribute("aria-label", "Open cart, " + cart.length + (cart.length === 1 ? " item" : " items"));
    }
    updateBundleOffer();
    if (!lines || !total || !payBtn) return;
    if (!cart.length) {
      lines.innerHTML = '<p class="empty">Cart is empty.</p>';
      total.textContent = money(0, true);
      payBtn.disabled = true;
      payBtn.textContent = "Check out";
      return;
    }
    var sum = 0;
    var html = "";
    cart.forEach(function (id) {
      var product = productById(id);
      if (!product) return;
      sum += product.price;
      var linked = checkoutUrl(product.id, "");
      var extra = "";
      if (product.includes && product.includes.length) {
        extra = "<small>" + esc(product.includes.map(function (childId) {
          var child = productById(childId);
          return child ? child.name : childId;
        }).join(", ")) + "</small>";
      }
      html += '<div class="line"><div class="sw" style="' + artStyle(product.colors) + '"></div>' +
        "<div><b>" + esc(product.name) + "</b><small>" + esc(money(product.price, true)) + "</small>" + extra + "</div>" +
        '<div class="line-actions"><button class="line-pay" type="button" data-pay="' + esc(product.id) + '">' +
        (linked ? "Pay with Stripe" : "Link needed") + "</button>" +
        '<button class="rm" type="button" data-remove="' + esc(product.id) + '">Remove</button></div></div>';
    });
    lines.innerHTML = html;
    total.textContent = money(sum, true);
    payBtn.disabled = false;
    payBtn.textContent = cart.length === 1 ? "Continue to Stripe" : "Review Stripe links";
    lines.querySelectorAll("[data-pay]").forEach(function (button) {
      button.addEventListener("click", function () {
        goToStripe(button.getAttribute("data-pay"));
      });
    });
    lines.querySelectorAll("[data-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        removeFromCart(button.getAttribute("data-remove"));
      });
    });
  }

  function toggleCart(id) {
    var product = productById(id);
    if (!product || product.sample) return;
    var index = cart.indexOf(id);
    if (index === -1) cart.push(id);
    else cart.splice(index, 1);
    saveCart();
    updateCart();
    syncAddButtons();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (item) { return item !== id; });
    saveCart();
    updateCart();
    syncAddButtons();
  }

  function wireAddButtons(root) {
    (root || document).querySelectorAll(".add").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleCart(button.getAttribute("data-id"));
      });
    });
  }

  function stars(rating) {
    var full = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    var on = "★★★★★".slice(0, full);
    var off = "★★★★★".slice(full);
    return '<span class="stars" role="img" aria-label="' + full + ' out of 5 stars"><span class="stars-on">' + on +
      '</span><span class="stars-dim">' + off + "</span></span>";
  }

  function reviewHtml(review) {
    var product = productById(review.productId);
    var name = product ? product.name : review.productId;
    return '<article class="review"><div class="review-top">' + stars(review.rating) +
      '<span class="placeholder-tag">Placeholder</span></div><p>' + esc(review.text) +
      '</p><p class="fine">' + esc(review.author || "Sample reviewer") + " · " + esc(name) + "</p></article>";
  }

  function reviewsBlock(list) {
    if (!list.length) return "";
    var pending = list.some(function (review) { return review.placeholder !== false; });
    return '<div class="review-wrap">' +
      (pending ? '<p class="note">Placeholder ratings — not real customer reviews yet.</p>' : "") +
      '<div class="reviews">' + list.map(reviewHtml).join("") + "</div></div>";
  }

  function priceHtml(product, withCode) {
    var now = esc(money(product.price, withCode));
    if (product.compareAt && product.compareAt > product.price) {
      return '<s class="compare">' + esc(money(product.compareAt)) + "</s> " + now;
    }
    return now;
  }

  function card(product) {
    var inCart = cart.indexOf(product.id) !== -1;
    var deal = dealLabel(product);
    var rating = reviewsFor(product.id);
    var media = thumbHtml(product, true);
    var ratingLine = rating.length ? '<p class="rating-line">' + stars(rating[0].rating) + ' <span class="fine">Placeholder</span></p>' : "";
    return '<article class="card">' + media +
      '<div class="body"><h3><a href="#item-' + esc(product.id) + '">' + esc(product.name) + "</a></h3>" +
      (deal ? '<p class="deal-pill">' + esc(deal) + "</p>" : "") +
      '<p class="desc">' + esc(product.desc) + "</p>" +
      '<p class="spec">' + (product.spec || []).map(function (part) { return "<span>" + esc(part) + "</span>"; }).join("") + "</p>" +
      ratingLine +
      '<div class="row"><p class="price">' + priceHtml(product, false) + "</p>" +
      '<button class="add" type="button" data-id="' + esc(product.id) + '" aria-pressed="' + (inCart ? "true" : "false") + '">' +
      (inCart ? "In cart" : "Add to cart") + "</button></div></div></article>";
  }

  function thumbHtml(product, linked) {
    var open = linked ? '<a class="thumb" href="#item-' + esc(product.id) + '"' : '<div class="thumb"';
    var close = linked ? "</a>" : "</div>";
    var image = product.images && product.images[0];
    var src = image ? safeAsset(image.src) : "";
    var inner;
    if (src) {
      inner = '<img src="' + esc(src) + '" alt="' + esc(image.alt || product.name) + '"' +
        (image.width ? ' width="' + Number(image.width) + '"' : "") +
        (image.height ? ' height="' + Number(image.height) + '"' : "") +
        ' loading="lazy" decoding="async">';
    } else {
      inner = "";
    }
    var style = src ? "" : ' style="' + artStyle(product.colors) + '"';
    var tag = '<span class="tag">' + esc(product.cat) + "</span>";
    return open + style + (linked ? ' aria-label="' + esc(product.name) + '"' : "") + ">" + inner + tag + close;
  }

  function faqList(items) {
    return items.map(function (item) {
      return "<details><summary>" + esc(item.q) + "</summary><p>" + esc(item.a) + "</p></details>";
    }).join("");
  }

  function bindForm(form, options) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      var honeypot = form.querySelector("[data-honeypot]");
      var status = form.querySelector("[data-status]");
      if (honeypot && honeypot.value) return;
      button.disabled = true;
      status.textContent = "";
      status.className = "msg";
      var body = new FormData();
      body.append("access_key", catalog.web3formsKey || "");
      body.append("subject", options.subject);
      var fields = options.fields();
      Object.keys(fields).forEach(function (key) {
        body.append(key, fields[key]);
      });
      fetch("https://api.web3forms.com/submit", { method: "POST", body: body })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (data && data.success) {
            status.textContent = options.success;
            status.className = "msg ok";
            form.reset();
            if (options.onSuccess) options.onSuccess();
          } else {
            status.textContent = options.failure;
            status.className = "msg bad";
          }
        })
        .catch(function () {
          status.textContent = "Network error.";
          status.className = "msg bad";
        })
        .then(function () {
          button.disabled = false;
        });
    });
  }

  function sampleReadyHtml() {
    var sample = productById("sample-watchtower");
    var files = filesFor(sample);
    var links = files.map(function (file) {
      var href = safeAsset(file.href);
      if (!href) return "<p>" + esc(file.name) + " is not uploaded yet.</p>";
      return '<a class="btn" href="' + esc(href) + '" download>' + esc(file.name) + "</a>";
    }).join("");
    return '<div class="sample-ready" id="sample-ready"><p class="msg ok">You are on the list. Here is the sample.</p>' +
      links + '<p class="fine"><a href="#guide">Install guide</a> for Litematica and WorldEdit.</p></div>';
  }

  function unlockSample() {
    sampleUnlocked = true;
    saveFlag("xi-sample", "sample-watchtower");
    document.querySelectorAll("[data-sample-form]").forEach(function (node) { node.hidden = true; });
    document.querySelectorAll("[data-sample-slot]").forEach(function (node) {
      node.hidden = false;
      node.innerHTML = sampleReadyHtml();
    });
  }

  function sampleSection() {
    var open = sampleUnlocked || loadFlag("xi-sample") === "sample-watchtower";
    if (open) sampleUnlocked = true;
    return '<section class="signup" id="sample"><p class="eyebrow">Free sample</p><h2>Try a watchtower first</h2>' +
      '<p class="lead">A small build for personal use. Your email signs you up for new-build notes and unlocks the sample.</p>' +
      '<div data-sample-slot' + (open ? "" : " hidden") + ">" + (open ? sampleReadyHtml() : "") + "</div>" +
      '<form id="sample-form" data-sample-form' + (open ? " hidden" : "") + ">" +
      '<input type="email" name="email" autocomplete="email" placeholder="Email" required aria-label="Email for the free sample">' +
      '<button class="btn" type="submit">Send me the sample</button>' +
      '<input class="hp" data-honeypot name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="msg" data-status></p></form></section>';
  }

  function bindSample() {
    var form = document.querySelector("#sample-form");
    if (!form) return;
    bindForm(form, {
      subject: "Newsletter signup",
      success: "Check below for the sample.",
      failure: "Couldn't subscribe. Try again.",
      fields: function () {
        return {
          email: form.querySelector('input[type="email"]').value,
          request: "free-sample",
          sample: "sample-watchtower"
        };
      },
      onSuccess: unlockSample
    });
  }

  function showcaseSection() {
    var ig = safeAsset(catalog.instagram);
    var yt = safeAsset(catalog.youtube);
    var video = youtubeId(catalog.showcaseVideo);
    var igCard = ig
      ? '<a class="social" href="' + esc(ig) + '" target="_blank" rel="noopener noreferrer"><p class="eyebrow">Instagram</p><strong>' +
        esc(catalog.instagramHandle || "@epicwatch6") + "</strong><span>New builds and screenshots.</span></a>"
      : "";
    var ytCard = '<div class="social"><p class="eyebrow">YouTube</p><strong>Build tours</strong><span>' +
      (yt ? "Watch on YouTube." : "Timelapses and build tours will land here.") + "</span>" +
      (yt ? '<a href="' + esc(yt) + '" target="_blank" rel="noopener noreferrer">Open the channel</a>' : "") +
      "</div>";
    var frame = video
      ? '<iframe class="video" loading="lazy" title="XanderIraq YouTube video" src="https://www.youtube-nocookie.com/embed/' +
        video + '" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
      : "";
    return '<section class="block"><div class="sec-head"><h2>Watch and follow</h2></div><div class="socials">' +
      igCard + ytCard + "</div>" + frame + "</section>";
  }

  function renderHome() {
    var featured = shopProducts().filter(function (product) { return product.featured; });
    if (!featured.length) featured = shopProducts().slice(0, 3);
    var flagship = productById("spawn-castle") || shopProducts()[0];
    var deals = shopProducts().filter(isBundle);
    var cats = CATEGORIES.filter(function (category) { return category.id !== "bundles"; }).map(function (category) {
      var sample = shopProducts().filter(function (product) { return product.cat === category.label; })[0] || flagship;
      var count = countIn(category.label);
      return '<a class="cat" href="#' + category.id + '"><span class="cat-art" style="' + artStyle(sample.colors) + '"></span><strong>' +
        esc(category.label) + "</strong><span>" + esc(category.blurb) + " " + count + " " + itemWord(count) + ".</span></a>";
    }).join("");
    app.innerHTML = '<section class="view"><section class="hero"><div class="hero-copy"><p class="eyebrow">Digital Minecraft goods</p>' +
      '<h1 class="big">Builds, photos and packs you can download tonight.</h1>' +
      '<p class="lead">Schematics, 4K screenshots and creator kits. Instant download, personal-use license.</p>' +
      '<ul class="perks"><li>Instant download</li><li>.schem + .litematic</li><li>Personal-use license</li></ul>' +
      '<div class="btns"><a class="btn" href="#shop">Browse the shop</a><a class="btn ghost" href="#contact">Request a custom build</a></div>' +
      '<p><a href="#sample">Get a free sample</a></p></div>' +
      '<a class="hero-card" href="#item-' + esc(flagship.id) + '"><span class="hero-art" style="' + artStyle(flagship.colors) + '"></span>' +
      '<span class="hero-card-copy"><span class="tag">' + esc(flagship.cat) + "</span><strong>" + esc(flagship.name) +
      "</strong><span>" + esc(money(flagship.price)) + "</span></span></a></section>" +
      '<section class="block"><div class="sec-head"><h2>Featured</h2><a href="#shop">See all ' + shopProducts().length + "</a></div>" +
      '<div class="grid">' + featured.map(card).join("") + "</div></section>" +
      '<section class="block"><div class="sec-head"><h2>Deals</h2><a href="#bundles">All bundles</a></div>' +
      '<div class="grid">' + deals.map(card).join("") + "</div></section>" +
      '<section class="block"><div class="sec-head"><h2>Categories</h2></div><div class="cats">' + cats + "</div></section>" +
      sampleSection() +
      '<section class="block"><div class="sec-head"><h2>Ratings</h2></div>' + reviewsBlock(reviewsFor("").slice(0, 3)) + "</section>" +
      showcaseSection() +
      '<section class="block"><div class="sec-head"><h2>FAQ</h2><a href="#faq">All questions</a></div><div class="faq">' +
      faqList(FAQ.slice(0, 3)) + "</div></section>" +
      '<section class="signup"><p class="eyebrow">Newsletter</p><h2>Get notified of new builds</h2>' +
      '<p class="lead">New schematics, photo sets, and packs.</p>' +
      '<form id="home-newsletter"><input type="email" name="email" autocomplete="email" placeholder="Email" required aria-label="Email">' +
      '<button class="btn" type="submit">Subscribe</button>' +
      '<input class="hp" data-honeypot name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="msg" data-status></p></form></section></section>';
    document.title = "XanderIraq — Minecraft Schematics, Photos & Packs";
    wireAddButtons(app);
    bindSample();
    bindForm(document.querySelector("#home-newsletter"), {
      subject: "Newsletter signup",
      success: "You're on the list.",
      failure: "Couldn't subscribe. Try again.",
      fields: function () {
        return { email: document.querySelector("#home-newsletter input[type=email]").value };
      }
    });
  }

  function matchesFilters(product, cat) {
    if (product.sample) return false;
    if (cat && product.cat !== cat.label) return false;
    if (query) {
      var hay = (product.name + " " + product.desc + " " + (product.included || []).join(" ")).toLowerCase();
      if (hay.indexOf(query.toLowerCase()) === -1) return false;
    }
    if (priceBand === "under-5" && !(product.price < 5)) return false;
    if (priceBand === "5-10" && !(product.price >= 5 && product.price <= 10)) return false;
    if (priceBand === "10-up" && !(product.price > 10)) return false;
    if (versionFilter) {
      var versions = product.versions || [];
      if (versions.indexOf("any") === -1 && versions.indexOf(versionFilter) === -1) return false;
    }
    if (sizeFilter && product.sizeClass !== sizeFilter) return false;
    return true;
  }

  function versionChoices() {
    var seen = {};
    shopProducts().forEach(function (product) {
      (product.versions || []).forEach(function (version) {
        if (version !== "any") seen[version] = true;
      });
    });
    return Object.keys(seen).sort();
  }

  function paintShopResults(cat) {
    var list = shopProducts().filter(function (product) { return matchesFilters(product, cat); });
    var perPage = catalog.perPage || 6;
    var pages = Math.max(1, Math.ceil(list.length / perPage));
    if (page > pages) page = pages;
    if (page < 1) page = 1;
    var slice = list.slice((page - 1) * perPage, page * perPage);
    var results = document.querySelector("#results");
    var pager = document.querySelector("#pager");
    var count = document.querySelector("#result-count");
    if (!results || !pager || !count) return;
    if (!list.length) {
      results.innerHTML = '<p class="empty">Nothing matches.</p>';
      pager.innerHTML = "";
      count.textContent = "Nothing matches.";
      return;
    }
    results.innerHTML = slice.map(card).join("");
    count.textContent = list.length + " " + (list.length === 1 ? "product" : "products");
    if (pages > 1) {
      var buttons = '<button type="button" data-page="' + (page - 1) + '"' + (page === 1 ? " disabled" : "") + ">Previous</button>";
      for (var i = 1; i <= pages; i += 1) {
        buttons += '<button type="button" data-page="' + i + '"' + (i === page ? ' aria-current="page"' : "") + ">" + i + "</button>";
      }
      buttons += '<button type="button" data-page="' + (page + 1) + '"' + (page === pages ? " disabled" : "") + ">Next</button>";
      buttons += "<small>Page " + page + " of " + pages + "</small>";
      pager.innerHTML = buttons;
      pager.querySelectorAll("[data-page]").forEach(function (button) {
        button.addEventListener("click", function () {
          if (button.disabled) return;
          page = Number(button.getAttribute("data-page"));
          paintShopResults(cat);
          var target = document.querySelector("#results");
          if (target && target.scrollIntoView) target.scrollIntoView({ block: "start" });
        });
      });
    } else {
      pager.innerHTML = "";
    }
    wireAddButtons(results);
  }

  function renderShop(catId) {
    var cat = catId ? categoryById(catId) : null;
    var key = cat ? cat.id : "all";
    if (key !== lastShopKey) {
      page = 1;
      lastShopKey = key;
    }
    var title = cat ? cat.label : "Shop";
    var lead = cat ? cat.blurb : "Schematics, photos, packs, and deals. Personal-use license.";
    var chips = '<button class="chip" type="button" data-cat="" aria-pressed="' + (!cat ? "true" : "false") + '">All</button>' +
      CATEGORIES.map(function (category) {
        return '<button class="chip" type="button" data-cat="' + category.id + '" aria-pressed="' +
          (cat && cat.id === category.id ? "true" : "false") + '">' + esc(category.label) + "</button>";
      }).join("");
    var versions = versionChoices().map(function (version) {
      return '<option value="' + esc(version) + '"' + (versionFilter === version ? " selected" : "") + ">" + esc(version) + "</option>";
    }).join("");
    app.innerHTML = '<section class="view"><header class="page-head"><p class="eyebrow">Catalog</p><h1 class="mid">' + esc(title) +
      '</h1><p class="lead">' + esc(lead) + "</p></header>" +
      '<div class="tools"><div class="chips" role="group" aria-label="Filter by category">' + chips + "</div>" +
      '<label class="visually-hidden" for="q">Search products</label>' +
      '<input class="search" id="q" type="search" placeholder="Search" value="' + esc(query) + '" autocomplete="off"></div>' +
      '<div class="filters">' +
      '<label class="filter">Price<select id="price-filter"><option value="">Any price</option>' +
      '<option value="under-5"' + (priceBand === "under-5" ? " selected" : "") + ">Under $5</option>" +
      '<option value="5-10"' + (priceBand === "5-10" ? " selected" : "") + ">$5 – $10</option>" +
      '<option value="10-up"' + (priceBand === "10-up" ? " selected" : "") + ">$10 and up</option></select></label>" +
      '<label class="filter">Version<select id="version-filter"><option value="">Any version</option>' + versions + "</select></label>" +
      '<label class="filter">Size<select id="size-filter"><option value="">Any size</option>' +
      '<option value="small"' + (sizeFilter === "small" ? " selected" : "") + ">Small</option>" +
      '<option value="medium"' + (sizeFilter === "medium" ? " selected" : "") + ">Medium</option>" +
      '<option value="large"' + (sizeFilter === "large" ? " selected" : "") + ">Large</option></select></label></div>" +
      '<p class="fine" id="result-count"></p><div class="grid" id="results"></div><div class="pager" id="pager"></div></section>';
    document.title = title + " — XanderIraq";
    document.querySelector("#q").addEventListener("input", function (event) {
      query = event.currentTarget.value;
      page = 1;
      paintShopResults(cat);
    });
    document.querySelector("#price-filter").addEventListener("change", function (event) {
      priceBand = event.currentTarget.value;
      page = 1;
      paintShopResults(cat);
    });
    document.querySelector("#version-filter").addEventListener("change", function (event) {
      versionFilter = event.currentTarget.value;
      page = 1;
      paintShopResults(cat);
    });
    document.querySelector("#size-filter").addEventListener("change", function (event) {
      sizeFilter = event.currentTarget.value;
      page = 1;
      paintShopResults(cat);
    });
    app.querySelectorAll(".chip").forEach(function (button) {
      button.addEventListener("click", function () {
        var nextCat = button.getAttribute("data-cat");
        page = 1;
        var nextHash = "#" + (nextCat || "shop");
        if (location.hash === nextHash) {
          lastShopKey = "";
          renderShop(nextCat);
        } else {
          location.hash = nextHash;
        }
      });
    });
    paintShopResults(cat);
  }

  function galleryHtml(product) {
    var images = (product.images || []).filter(function (image) { return safeAsset(image.src); });
    if (!images.length) {
      return '<div class="gallery"><div class="gallery-main thumb" style="' + artStyle(product.colors) + '" role="img" aria-label="' +
        esc(product.name) + '"></div><p class="fine">Screenshots will show here once they are added to this product.</p></div>';
    }
    var first = images[0];
    var main = '<img id="gallery-photo" src="' + esc(safeAsset(first.src)) + '" alt="' + esc(first.alt || product.name) + '"' +
      (first.width ? ' width="' + Number(first.width) + '"' : "") +
      (first.height ? ' height="' + Number(first.height) + '"' : "") +
      ' decoding="async">';
    var thumbs = images.map(function (image, index) {
      return '<button type="button" class="shot" data-shot="' + index + '" aria-label="' + esc(image.alt || "Image " + (index + 1)) + '">' +
        '<img src="' + esc(safeAsset(image.src)) + '" alt="" width="144" height="108" loading="lazy" decoding="async"></button>';
    }).join("");
    return '<div class="gallery" id="gallery"><div class="gallery-main">' + main + "</div>" +
      (images.length > 1 ? '<div class="thumbs">' + thumbs + "</div>" : "") + "</div>";
  }

  function bindGallery(product) {
    var images = (product.images || []).filter(function (image) { return safeAsset(image.src); });
    var photo = document.querySelector("#gallery-photo");
    if (!photo) return;
    document.querySelectorAll("[data-shot]").forEach(function (button) {
      button.addEventListener("click", function () {
        var image = images[Number(button.getAttribute("data-shot"))];
        if (!image) return;
        photo.src = safeAsset(image.src);
        photo.alt = image.alt || product.name;
      });
    });
  }

  function videoHtml(product) {
    var id = youtubeId(product.video);
    if (!id) return "";
    return '<iframe class="video" loading="lazy" title="' + esc(product.name) + ' video" src="https://www.youtube-nocookie.com/embed/' +
      id + '" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
  }

  function factsHtml(product) {
    var rows = '<dt>Category</dt><dd>' + esc(product.cat) + "</dd>";
    if (product.size && product.size.x) {
      rows += "<dt>Size</dt><dd>" + esc(product.size.x + " × " + product.size.y + " × " + product.size.z) + "</dd>";
    }
    if (product.size && product.size.blocks) {
      rows += "<dt>Blocks</dt><dd>" + esc(String(product.size.blocks).replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + "</dd>";
    }
    var versions = (product.versions || []).filter(function (version) { return version !== "any"; });
    rows += "<dt>Versions</dt><dd>" + esc(versions.length ? versions.join(", ") : "Not tied to one Minecraft version") + "</dd>";
    if (product.deal) rows += "<dt>Deal</dt><dd>" + esc(dealLabel(product)) + "</dd>";
    rows += "<dt>License</dt><dd>Personal use</dd><dt>Delivery</dt><dd>Instant download after checkout</dd>";
    return rows;
  }

  function purchaseActions(product) {
    var inCart = cart.indexOf(product.id) !== -1;
    var href = checkoutUrl(product.id, "");
    var add = '<button class="' + (href ? "add ghost" : "add") + '" type="button" data-id="' + esc(product.id) + '" aria-pressed="' +
      (inCart ? "true" : "false") + '">' + (inCart ? "In cart" : "Add to cart") + "</button>";
    if (!href) {
      return '<div class="btns">' + add + '</div><p class="note">Stripe Payment Link not set yet for ' + esc(product.id) + ".</p>";
    }
    return '<div class="btns"><a class="btn" href="' + esc(href) + '">Buy with Stripe</a>' + add + "</div>";
  }

  function renderProduct(id) {
    var product = productById(id);
    if (!product || product.sample) {
      location.hash = "#shop";
      return;
    }
    var list = shopProducts().filter(function (item) { return item.cat === product.cat; });
    if (list.length < 2) list = shopProducts();
    var index = list.indexOf(product);
    var prev = list[(index - 1 + list.length) % list.length];
    var next = list[(index + 1) % list.length];
    var cat = categoryById(product.cat.toLowerCase()) || { id: "shop" };
    var includes = (product.included || []).map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("");
    var children = (product.includes || []).map(function (childId) {
      var child = productById(childId);
      if (!child) return "";
      return '<li><a href="#item-' + esc(child.id) + '">' + esc(child.name) + "</a> · " + esc(money(child.price, true)) + "</li>";
    }).join("");
    app.innerHTML = '<section class="view"><p class="crumbs"><a href="#shop">Shop</a><span>/</span><a href="#' + esc(cat.id) + '">' +
      esc(product.cat) + "</a><span>/</span><span>" + esc(product.name) + "</span></p>" +
      '<div class="pdp"><div>' + galleryHtml(product) + videoHtml(product) + "</div>" +
      '<div class="pdp-info"><p class="eyebrow">' + esc(product.cat) + "</p><h1 class=\"mid\">" + esc(product.name) + "</h1>" +
      '<p class="price">' + priceHtml(product, true) + "</p>" + purchaseActions(product) +
      '<p class="lead">' + esc(product.desc) + '</p><dl class="facts">' + factsHtml(product) + "</dl>" +
      "<h2>What's included</h2><ul class=\"included\">" + includes + "</ul>" +
      (children ? "<h2>In this deal</h2><ul class=\"included\">" + children + "</ul>" : "") +
      '<p><a href="#guide">How to install Litematica and WorldEdit</a></p></div></div>' +
      reviewsBlock(reviewsFor(product.id)) +
      '<div class="flip"><a href="#item-' + esc(prev.id) + '"><small>Previous</small><b>' + esc(prev.name) + "</b></a>" +
      '<a class="next" href="#item-' + esc(next.id) + '"><small>Next</small><b>' + esc(next.name) + "</b></a></div></section>";
    document.title = product.name + " — XanderIraq";
    wireAddButtons(app);
    bindGallery(product);
  }

  function fileListHtml(product) {
    var files = filesFor(product);
    if (!files.length) {
      return "<p>No files are listed for this product yet.</p>";
    }
    return '<ul class="file-list">' + files.map(function (file) {
      var href = safeAsset(file.href);
      if (href) return '<li><a class="btn" href="' + esc(href) + '" download>' + esc(file.name) + "</a></li>";
      return "<li><strong>" + esc(file.name) + "</strong><span>Not uploaded yet. Use Contact if you already paid and need the file.</span></li>";
    }).join("") + "</ul>";
  }

  function renderThanks(id) {
    var product = id ? productById(id) : null;
    if (product && cart.indexOf(product.id) !== -1) removeFromCart(product.id);
    app.innerHTML = '<section class="view"><header class="page-head"><p class="eyebrow">Download</p><h1 class="mid">' +
      (product ? "Thanks — " + esc(product.name) : "Thanks for the purchase") + "</h1>" +
      "<p class=\"lead\">Your Stripe receipt is the record of payment. This page is where the files are listed. Keep the personal-use license in mind: don't resell or redistribute them.</p></header>" +
      (product ? fileListHtml(product) : "<p>Open the thank-you link from your Payment Link, or pick the product from the shop and I can resend the file.</p>") +
      '<div class="btns"><a class="btn" href="#guide">Install guide</a><a class="btn ghost" href="#shop">Back to the shop</a></div></section>';
    document.title = "Download — XanderIraq";
  }

  function renderGuide() {
    app.innerHTML = '<section class="view"><header class="page-head"><p class="eyebrow">Setup</p><h1 class="mid">Install guide</h1>' +
      '<p class="lead">Schematics arrive as .litematic and .schem. Photos and packs do not need either tool. Use the matching loader for your Minecraft version.</p></header>' +
      "<h2>Litematica (.litematic)</h2>" +
      '<ol class="steps guide-steps"><li><strong>1. Install Fabric</strong><p>Run the Fabric installer for your Minecraft version from <a href="https://fabricmc.net/" target="_blank" rel="noopener noreferrer">fabricmc.net</a>.</p></li>' +
      '<li><strong>2. Add three mods</strong><p>Download Fabric API, MaLiLib, and Litematica for that same version from <a href="https://modrinth.com/mod/litematica" target="_blank" rel="noopener noreferrer">Modrinth</a>. Put the jars in <code>.minecraft/mods</code>.</p></li>' +
      '<li><strong>3. Load the file</strong><p>Launch the Fabric profile. In a world, press M. Load the .litematic. In creative, paste the schematic. In survival, follow the material list against the hologram.</p></li></ol>' +
      "<h2>WorldEdit (.schem)</h2><h3>Single player</h3>" +
      '<ol class="steps guide-steps"><li><strong>1. Install WorldEdit</strong><p>Use the Fabric or NeoForge build that matches your version, from <a href="https://enginehub.org/worldedit" target="_blank" rel="noopener noreferrer">EngineHub</a> or Modrinth. Put the jar in <code>.minecraft/mods</code>.</p></li>' +
      '<li><strong>2. Park the file</strong><p>Launch once so WorldEdit can create its folder. Put the .schem in <code>.minecraft/config/worldedit/schematics</code>.</p></li>' +
      '<li><strong>3. Paste</strong><p>Stand where the build should go. Run <code>//schem load name</code> without the extension, then <code>//paste</code>.</p></li></ol>' +
      "<h3>Server</h3>" +
      '<ol class="steps guide-steps"><li><strong>1. Add the plugin or mod</strong><p>On Paper, put the WorldEdit plugin jar in <code>plugins</code> and restart. On a Fabric server, use the mod.</p></li>' +
      '<li><strong>2. Upload the schematic</strong><p>Place the .schem in <code>plugins/WorldEdit/schematics</code> (Paper) or the server WorldEdit schematics folder.</p></li>' +
      '<li><strong>3. Paste with permission</strong><p><code>//schem load name</code> then <code>//paste</code>. You need WorldEdit permission on that server.</p></li></ol>' +
      '<div class="note"><p>Personal use covers a world you play, including a private server. Don\'t upload the files to a public download site or resell them. Questions go through Contact.</p></div></section>';
    document.title = "Install guide — XanderIraq";
  }

  function renderFaq() {
    app.innerHTML = '<section class="view"><header class="page-head"><p class="eyebrow">Help</p><h1 class="mid">FAQ</h1>' +
      '<p class="lead">I make Minecraft schematics, 4K screenshots and creator kits. Everything is ready to download the moment you check out.</p></header>' +
      '<div class="prose"><p>Builds are tested in 1.20+ (some work in 1.19). Photos are 4K PNG. Packs include the files listed on each product. Schematics need <a href="#guide">Litematica or WorldEdit</a>.</p></div>' +
      "<h2>How it works</h2><ol class=\"steps\">" +
      "<li><strong>1. Pick something</strong><p>Browse the shop, grab the free sample, or request a custom build.</p></li>" +
      "<li><strong>2. Check out</strong><p>Enter your email. Stripe charges one Payment Link at a time, then sends you to the download page.</p></li>" +
      "<li><strong>3. Use it</strong><p>Personal-use license. Don't resell or redistribute the files.</p></li></ol>" +
      '<h2>Questions</h2><div class="faq">' + faqList(FAQ) + "</div></section>";
    document.title = "FAQ — XanderIraq";
  }

  function renderSamplePage() {
    app.innerHTML = '<section class="view"><header class="page-head"><p class="eyebrow">Free</p><h1 class="mid">Sample Watchtower</h1>' +
      '<p class="lead">' + esc((productById("sample-watchtower") || {}).desc || "") + "</p></header>" +
      sampleSection() + "</section>";
    document.title = "Free sample — XanderIraq";
    bindSample();
  }

  function renderContact() {
    app.innerHTML = '<section class="view"><header class="page-head"><p class="eyebrow">Hello</p><h1 class="mid">Contact</h1>' +
      '<p class="lead">Questions, custom requests, or just saying hi. I usually reply within a day.</p></header>' +
      '<form class="formcard" id="contact-form"><div class="two">' +
      '<div class="field"><label for="contact-name">Name</label><input id="contact-name" name="name" autocomplete="name" required></div>' +
      '<div class="field"><label for="contact-email">Email</label><input id="contact-email" name="email" type="email" autocomplete="email" required></div></div>' +
      '<div class="field"><label for="contact-topic">Topic</label><select id="contact-topic">' +
      "<option>Custom build</option><option>Question about a product</option><option>Other</option></select></div>" +
      '<div class="field"><label for="contact-body">Message</label><textarea id="contact-body" required></textarea></div>' +
      '<input class="hp" data-honeypot name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="btn" type="submit">Send</button><p class="msg" data-status></p></form>' +
      '<section class="signup"><strong>Get notified of new builds</strong>' +
      '<form id="contact-newsletter"><input type="email" autocomplete="email" placeholder="Email" required aria-label="Email">' +
      '<button class="btn" type="submit">Subscribe</button>' +
      '<input class="hp" data-honeypot name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="msg" data-status></p></form></section></section>';
    document.title = "Contact — XanderIraq";
    bindForm(document.querySelector("#contact-form"), {
      subject: "Contact from XanderIraq",
      success: "Sent. I'll reply soon.",
      failure: "Something went wrong. Try again.",
      fields: function () {
        return {
          name: document.querySelector("#contact-name").value,
          email: document.querySelector("#contact-email").value,
          topic: document.querySelector("#contact-topic").value,
          message: document.querySelector("#contact-body").value
        };
      }
    });
    bindForm(document.querySelector("#contact-newsletter"), {
      subject: "Newsletter signup",
      success: "You're on the list.",
      failure: "Couldn't subscribe. Try again.",
      fields: function () {
        return { email: document.querySelector("#contact-newsletter input[type=email]").value };
      }
    });
  }

  function currentHash() {
    var raw = location.hash.charAt(0) === "#" ? location.hash.slice(1) : location.hash;
    try {
      return decodeURIComponent(raw).trim();
    } catch (error) {
      return raw.trim();
    }
  }

  function setCurrentTab(name) {
    var current = null;
    tabs.querySelectorAll("a").forEach(function (link) {
      if (link.getAttribute("data-v") === name) {
        link.setAttribute("aria-current", "page");
        current = link;
      } else {
        link.removeAttribute("aria-current");
      }
    });
    if (!current) return;
    var left = current.offsetLeft - 16;
    tabs.scrollLeft = left < 0 ? 0 : left;
  }

  function updateTabFade() {
    var row = tabs.parentElement;
    if (!row) return;
    var more = tabs.scrollWidth - tabs.clientWidth - tabs.scrollLeft > 4;
    row.classList.toggle("can-scroll", more);
  }

  function render() {
    var hash = currentHash() || "home";
    if (hash === "about") hash = "faq";
    if (hash === "home") {
      setCurrentTab("home");
      renderHome();
    } else if (hash === "shop") {
      setCurrentTab("shop");
      renderShop("");
    } else if (categoryById(hash)) {
      setCurrentTab(hash === "bundles" ? "shop" : hash);
      renderShop(hash);
    } else if (hash.indexOf("item-") === 0) {
      var product = productById(hash.slice(5));
      if (!product || product.sample) {
        location.hash = "#shop";
        return;
      }
      var cat = categoryById(product.cat.toLowerCase());
      setCurrentTab(cat && cat.id !== "bundles" ? cat.id : "shop");
      renderProduct(product.id);
    } else if (hash === "faq") {
      setCurrentTab("faq");
      renderFaq();
    } else if (hash === "contact") {
      setCurrentTab("contact");
      renderContact();
    } else if (hash === "guide") {
      setCurrentTab("guide");
      renderGuide();
    } else if (hash === "sample") {
      setCurrentTab("home");
      renderSamplePage();
    } else if (hash === "thanks" || hash.indexOf("thanks-") === 0) {
      setCurrentTab("");
      renderThanks(hash === "thanks" ? "" : hash.slice(7));
    } else {
      setCurrentTab("home");
      renderHome();
    }
    updateCart();
    updateTabFade();
  }

  function route(shouldScroll) {
    try {
      render();
    } catch (error) {
      console.error(error);
      app.innerHTML = '<section class="view"><h1 class="mid">Something went wrong.</h1><p class="lead">Reload the page.</p></section>';
    }
    if (shouldScroll) window.scrollTo(0, 0);
  }

  function checkoutEmail() {
    var input = document.querySelector("#checkout-email");
    if (!input) return "";
    var email = input.value.trim();
    if (!email || !input.checkValidity()) {
      input.reportValidity();
      return "";
    }
    return email;
  }

  function missingLinkNames() {
    var names = [];
    cart.forEach(function (id) {
      if (!checkoutUrl(id, "")) {
        var product = productById(id);
        if (product) names.push(product.name);
      }
    });
    return names;
  }

  function goToStripe(id) {
    if (!checkoutUrl(id, "")) {
      var product = productById(id);
      setCartMessage("No Stripe Payment Link set for " + (product ? product.name : "that product") + ". Add it in products.js.", "bad");
      return;
    }
    var email = checkoutEmail();
    if (!email) return;
    setCartMessage("Taking you to Stripe…", "");
    window.location.assign(checkoutUrl(id, email));
  }

  function openCart() {
    lastFocus = document.activeElement;
    cartPanel.hidden = false;
    scrim.hidden = false;
    cartPanel.inert = false;
    document.body.classList.add("cart-open");
    document.querySelector("#close-cart").focus();
  }

  function closeCart() {
    cartPanel.hidden = true;
    scrim.hidden = true;
    cartPanel.inert = true;
    document.body.classList.remove("cart-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onCartKeydown(event) {
    if (cartPanel.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeCart();
      return;
    }
    if (event.key !== "Tab") return;
    var list = [];
    cartPanel.querySelectorAll("button, a, input, select, textarea").forEach(function (node) {
      if (!node.disabled && node.offsetParent !== null) list.push(node);
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function applyTheme(mode) {
    var root = document.documentElement;
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
    document.querySelectorAll("#theme button").forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-mode") === mode ? "true" : "false");
    });
    saveFlag("xi-theme", mode);
    var dark = mode === "dark" || (mode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#12100e" : "#f4efe6");
  }

  if (!catalog || !catalog.products) {
    app.innerHTML = '<section class="view"><h1 class="mid">Catalog missing.</h1><p class="lead">products.js did not load.</p></section>';
    return;
  }
  PRODUCTS = catalog.products;

  var cartPanel = document.querySelector("#cart");
  var scrim = document.querySelector("#scrim");
  cartPanel.inert = true;
  document.querySelector("#open-cart").addEventListener("click", openCart);
  document.querySelector("#close-cart").addEventListener("click", closeCart);
  scrim.addEventListener("click", closeCart);
  document.addEventListener("keydown", onCartKeydown);
  document.querySelector("#checkout").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!cart.length) {
      setCartMessage("Your cart is empty.", "bad");
      return;
    }
    var missing = missingLinkNames();
    if (missing.length) {
      setCartMessage("Add Stripe Payment Links for: " + missing.join(", ") + ".", "bad");
      return;
    }
    if (cart.length === 1) {
      goToStripe(cart[0]);
      return;
    }
    var email = checkoutEmail();
    if (!email) return;
    setCartMessage("Stripe Payment Links check out one product at a time. A bundle is one link for the whole set. Otherwise use Pay with Stripe on a line — the other items stay in your cart.", "");
  });
  document.querySelector("#theme").addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    applyTheme(button.getAttribute("data-mode"));
  });
  try {
    applyTheme(loadFlag("xi-theme") || "auto");
  } catch (error) {
    applyTheme("auto");
  }
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if ((loadFlag("xi-theme") || "auto") === "auto") applyTheme("auto");
    });
  } catch (error) {}
  tabs.addEventListener("scroll", updateTabFade, { passive: true });
  window.addEventListener("resize", updateTabFade);
  window.addEventListener("hashchange", function () {
    route(true);
    if (app && app.focus) app.focus({ preventScroll: true });
  });
  var year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  cart = loadCart();
  route(false);

  window.XanderIraq = {
    currency: catalog.currency,
    products: PRODUCTS,
    checkoutUrl: checkoutUrl,
    esc: esc
  };
})();
