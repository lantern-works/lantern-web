/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.3.0/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "apps/chk/index.css",
    "revision": "88792272f899743128b8b803f23e854b"
  },
  {
    "url": "apps/chk/index.html",
    "revision": "b2acf855255a5f8d5dee08a43986972c"
  },
  {
    "url": "apps/chk/index.js",
    "revision": "88e0784cb52c1d98c54391cc96b494dc"
  },
  {
    "url": "apps/dba/index.css",
    "revision": "48839f2060a762b216485e3683d205fa"
  },
  {
    "url": "apps/dba/index.html",
    "revision": "1fa22fb692783a92333001a38b624a22"
  },
  {
    "url": "apps/dba/index.js",
    "revision": "fb9212b89360de4b79e4514c1a3b752c"
  },
  {
    "url": "apps/net/index.css",
    "revision": "8ec89b8d1d526bb148a21d6ac5cbaa59"
  },
  {
    "url": "apps/net/index.html",
    "revision": "fd37a40caa7368a445b9c0f00b1f7ac1"
  },
  {
    "url": "apps/net/index.js",
    "revision": "138c50c980255bbc5f7c5d44236a1388"
  },
  {
    "url": "apps/rdr/detail.css",
    "revision": "24309ce573a2f54fa21379aa2f344597"
  },
  {
    "url": "apps/rdr/detail.html",
    "revision": "6abe10cf2f7c3c0f79bdf5f24904fb9a"
  },
  {
    "url": "apps/rdr/detail.js",
    "revision": "f8a28a0d6a5405b473530693216689bc"
  },
  {
    "url": "apps/rdr/index.css",
    "revision": "b6f6cf6c03b334ec915a88b80dbed1b8"
  },
  {
    "url": "apps/rdr/index.html",
    "revision": "f4e796209473ce2955339b0009fca971"
  },
  {
    "url": "apps/rdr/index.js",
    "revision": "742b9fbf39ba9232a184aaedfc8b3c43"
  },
  {
    "url": "apps/rpt/index.css",
    "revision": "119c3d34a72dd988d167680196b55ade"
  },
  {
    "url": "apps/rpt/index.html",
    "revision": "4c32bcb3fa14805201bf3ab46caab22b"
  },
  {
    "url": "apps/rpt/index.js",
    "revision": "316929fd605038100c3131877e7f42fd"
  },
  {
    "url": "hotspot.html",
    "revision": "9a22bae0a422fbe643d9d495e44d305f"
  },
  {
    "url": "index.css",
    "revision": "a322f731098100fce84df5680568ec57"
  },
  {
    "url": "index.html",
    "revision": "37dfe042de7b760aa5262f69a0f478f0"
  },
  {
    "url": "index.js",
    "revision": "4f85092a76f4e2deffd5e35100746db3"
  },
  {
    "url": "intro/a.html",
    "revision": "7875d187b41e35a693ce9779eabc8b05"
  },
  {
    "url": "intro/b.html",
    "revision": "b836c6505e5b11ec1bc96662b5f157a8"
  },
  {
    "url": "intro/c.html",
    "revision": "68eb56c7cd242e27543dab88da5eb33b"
  },
  {
    "url": "lib/lantern.css",
    "revision": "b09fb00de72fb20a969c16ba9b40a00e"
  },
  {
    "url": "manifest.json",
    "revision": "8f392d3eaa1e00cac800a6b5ffe3efb7"
  },
  {
    "url": "media/favicon/safari-pinned-tab.svg",
    "revision": "1143884328fb4dc69fae54eac9eccfdb"
  },
  {
    "url": "media/icons/css/all.css",
    "revision": "ee8c65c3604b12ffbd3b7d093eeb8c32"
  },
  {
    "url": "media/icons/css/all.min.css",
    "revision": "597b70b2ce6b1483f72526c906918fe9"
  },
  {
    "url": "media/icons/css/brands.css",
    "revision": "127cb8f6670d4788d86e858190f64b31"
  },
  {
    "url": "media/icons/css/brands.min.css",
    "revision": "ab62d037fa1cdb0f8b5cb8de2bcd4a62"
  },
  {
    "url": "media/icons/css/fontawesome.css",
    "revision": "7e868d39994348a643753429713e0e08"
  },
  {
    "url": "media/icons/css/fontawesome.min.css",
    "revision": "7d2230b007a9313e4f6fe6326dfcb002"
  },
  {
    "url": "media/icons/css/regular.css",
    "revision": "4e45c3fc6f308783b395d41967320a56"
  },
  {
    "url": "media/icons/css/regular.min.css",
    "revision": "d80445041f6774d949debc12596067a8"
  },
  {
    "url": "media/icons/css/solid.css",
    "revision": "3259d50befcbe0f639262828073894ea"
  },
  {
    "url": "media/icons/css/solid.min.css",
    "revision": "129190453beb880efe8830b4706671ef"
  },
  {
    "url": "media/icons/css/svg-with-js.css",
    "revision": "ee683e04209d4f43ae596cf1141ff5e5"
  },
  {
    "url": "media/icons/css/svg-with-js.min.css",
    "revision": "e115adb8623097026038966528dd5ab6"
  },
  {
    "url": "media/icons/css/v4-shims.css",
    "revision": "28a04437e7ed02acb8618e4a588c68b9"
  },
  {
    "url": "media/icons/css/v4-shims.min.css",
    "revision": "01727b5056f65c2ac938f5db4e552b10"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.eot",
    "revision": "69b310edc4e366b06627596657ffd6e2"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.svg",
    "revision": "5da7e33c62be3559dce2c91476435e34"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.ttf",
    "revision": "d94572ddae31011adf538b407c99e8c1"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.woff",
    "revision": "e9f8333989a84d0bd403f6d15e717fb1"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.woff2",
    "revision": "66f625f1d99357cb1559bea25c827270"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.eot",
    "revision": "0b7928f6fbf544c473e51e6579da0bec"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.svg",
    "revision": "4e41caaf414b0335fc8219f0739a2adb"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.ttf",
    "revision": "cdd8fa76f79bbe1cd789e8b78831b2b0"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.woff",
    "revision": "d9e29124cc610631509da59240e8fc95"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.woff2",
    "revision": "930c12643983f664f026b6e65300f09d"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.eot",
    "revision": "0b93480e003507618e8e1198126a2d37"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.svg",
    "revision": "666a82cb3e9f8591bef4049aea26c4c6"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.ttf",
    "revision": "a7a790d499af8d37b9f742a666ab849c"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.woff",
    "revision": "dfc040d53fa343d2ba7ccb8217f34346"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.woff2",
    "revision": "e8a92a29978352517c450b9a800b06cb"
  },
  {
    "url": "welcome.html",
    "revision": "402222a444edbea5e4258334fa6a4a9a"
  },
  {
    "url": "lib/lantern.js",
    "revision": "f2461b979fd4674682ad5f54e2b9084d"
  },
  {
    "url": "lib/map.css",
    "revision": "9b465e5f4c4d62749c489bcc8b88da62"
  },
  {
    "url": "lib/map.js",
    "revision": "5a9f1f10a6cfeb274497384b12855344"
  },
  {
    "url": "lib/vendor.js",
    "revision": "2424177957c131efab437d13ba8f28b2"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/\.(?:png|jpg|jpeg)$/, workbox.strategies.staleWhileRevalidate({ cacheName: "images", plugins: [new workbox.expiration.Plugin({"maxEntries":10,"purgeOnQuotaError":false})] }), 'GET');
