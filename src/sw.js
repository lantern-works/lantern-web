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
    "revision": "b0cd76a9ba7d1145dbf6aec1680836e2"
  },
  {
    "url": "apps/chk/index.html",
    "revision": "18b8c29d7680a5c47bdb3be98da06dfd"
  },
  {
    "url": "apps/chk/index.js",
    "revision": "397cf954e609e43329d2ea4a1a111fbf"
  },
  {
    "url": "apps/dba/index.css",
    "revision": "48839f2060a762b216485e3683d205fa"
  },
  {
    "url": "apps/dba/index.html",
    "revision": "2620d44ab150db9a4e14e6cd89a7943f"
  },
  {
    "url": "apps/dba/index.js",
    "revision": "fb9212b89360de4b79e4514c1a3b752c"
  },
  {
    "url": "apps/net/index.css",
    "revision": "4e8f6a9825ec75a40698c0ee0291ad2f"
  },
  {
    "url": "apps/net/index.html",
    "revision": "a907c3991ecbc0dd09670be2be875536"
  },
  {
    "url": "apps/net/index.js",
    "revision": "6a14580373d490e71f9ec5f35a1cf587"
  },
  {
    "url": "apps/rdr/detail.css",
    "revision": "ef19a991578578d983d977b4c5e118f0"
  },
  {
    "url": "apps/rdr/detail.html",
    "revision": "14c73adbdd1ffb95c5d748e5921dbec1"
  },
  {
    "url": "apps/rdr/detail.js",
    "revision": "e754c31758362599464a3e140ac0a09e"
  },
  {
    "url": "apps/rdr/index.css",
    "revision": "8c2fe6c5e7e7afc694ac3f8d054b18fd"
  },
  {
    "url": "apps/rdr/index.html",
    "revision": "a36c1f00d849f0ee82ff8f609693d28f"
  },
  {
    "url": "apps/rdr/index.js",
    "revision": "ca1c336d966c1bd9e0fb2ad53dc7b0d7"
  },
  {
    "url": "apps/rpt/index.css",
    "revision": "4bbd2c7004c6be9962cde5762d925eb0"
  },
  {
    "url": "apps/rpt/index.html",
    "revision": "d042ad87960a3f188ac8014114bdc2a1"
  },
  {
    "url": "apps/rpt/index.js",
    "revision": "04426c3f54358e0bcda07254a18638ea"
  },
  {
    "url": "hotspot.html",
    "revision": "9a22bae0a422fbe643d9d495e44d305f"
  },
  {
    "url": "index.css",
    "revision": "b7cc1bcaeeec9fb959dd150360a7321f"
  },
  {
    "url": "index.html",
    "revision": "c0e410eef26b050e4cccce51ea796d3e"
  },
  {
    "url": "index.js",
    "revision": "23f17b32d8717c0827774414de7e6328"
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
    "revision": "42bf7f03de21ed48c6d6934ebac0cbc3"
  },
  {
    "url": "lib/import.js",
    "revision": "aebb0739d8dac11ba1d20fa6af9d3f88"
  },
  {
    "url": "lib/lantern.css",
    "revision": "40b8a3cc61ff2a8ff1e7fb468b52aaf6"
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
    "revision": "ba97d60851c4f963ce1b891b04204830"
  },
  {
    "url": "lib/map.css",
    "revision": "9b465e5f4c4d62749c489bcc8b88da62"
  },
  {
    "url": "lib/map.js",
    "revision": "c7b5234daf2f04aa9a343b3d029f578c"
  },
  {
    "url": "lib/vendor.js",
    "revision": "2424177957c131efab437d13ba8f28b2"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/\.(?:png|jpg|jpeg)$/, workbox.strategies.networkFirst({ cacheName: "images", plugins: [new workbox.expiration.Plugin({"maxEntries":10,"purgeOnQuotaError":false})] }), 'GET');
