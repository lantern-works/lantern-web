__base = "../";

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

importScripts("workbox-v3.3.0/workbox-sw.js");
workbox.setConfig({modulePathPrefix: "workbox-v3.3.0"});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "/apps/chk/index.css",
    "revision": "1ea3afc52fa91285f64a456a6f2225c0"
  },
  {
    "url": "/apps/chk/index.html",
    "revision": "da46cb84aca177c4ce4da1769e858dfa"
  },
  {
    "url": "/apps/chk/index.js",
    "revision": "bb0714704cc060998ab2d3dc37d5a826"
  },
  {
    "url": "/apps/dba/import.js",
    "revision": "787269e919bf70ebb9c8e1d155929885"
  },
  {
    "url": "/apps/dba/index.css",
    "revision": "74b6c8b6ac22b2240e9224e1cb9db036"
  },
  {
    "url": "/apps/dba/index.html",
    "revision": "5ac761a75839f0a56cd79ffe732ce833"
  },
  {
    "url": "/apps/dba/index.js",
    "revision": "a1c3fa55a838e9b590ab046ad736893e"
  },
  {
    "url": "/apps/net/index.css",
    "revision": "bc6eaaf7c805cd94f25a5db286da70df"
  },
  {
    "url": "/apps/net/index.html",
    "revision": "4cd996f05bf93b26db73fd28012da302"
  },
  {
    "url": "/apps/net/index.js",
    "revision": "84f0daf1f654418c35f527ae4a721dc8"
  },
  {
    "url": "/apps/ote/index.css",
    "revision": "193e645f8a7471bd792a31331613382b"
  },
  {
    "url": "/apps/ote/index.html",
    "revision": "1483b3395e27c94ce8cfceb985bc7b9b"
  },
  {
    "url": "/apps/ote/index.js",
    "revision": "5c8eba70cdb75fb9967d8f6e5f393b40"
  },
  {
    "url": "/apps/rdr/browse.css",
    "revision": "2d3936457501a19483cb27ab181a6b3b"
  },
  {
    "url": "/apps/rdr/browse.html",
    "revision": "5985d17296db6e62ace6dd834417f875"
  },
  {
    "url": "/apps/rdr/browse.js",
    "revision": "b1b116e151bbcea40d4ea48a40c9d6b9"
  },
  {
    "url": "/apps/rdr/detail.css",
    "revision": "40d39d7a7e95b26a9a86f8a81fbaae62"
  },
  {
    "url": "/apps/rdr/detail.html",
    "revision": "22de946839f89c8e92a74776d8635dd7"
  },
  {
    "url": "/apps/rdr/detail.js",
    "revision": "7a7470733f69d0aead1ff4cf92855320"
  },
  {
    "url": "/apps/rdr/index.css",
    "revision": "cdd64f282763ce517e1af71418e2f32f"
  },
  {
    "url": "/apps/rdr/index.html",
    "revision": "2d911764c8e55fb5ec11331054260548"
  },
  {
    "url": "/apps/rdr/index.js",
    "revision": "43089040d61d4a4a00e28d73576afe1b"
  },
  {
    "url": "/apps/rpt/index.css",
    "revision": "b069ba5f43349977de88cee012e73af6"
  },
  {
    "url": "/apps/rpt/index.html",
    "revision": "321c65533e93cd2478e3fefb135266b8"
  },
  {
    "url": "/apps/rpt/index.js",
    "revision": "c136b30513e94d0ae46760f5d128698f"
  },
  {
    "url": "/hotspot.html",
    "revision": "20a36a70284a8d51a868ba35a3cf38c2"
  },
  {
    "url": "/index.css",
    "revision": "b7cc1bcaeeec9fb959dd150360a7321f"
  },
  {
    "url": "/index.html",
    "revision": "3499fc7ecbc7ac623abade7c546fbf33"
  },
  {
    "url": "/index.js",
    "revision": "e536f3a7fa898f941494d4934ca53fd2"
  },
  {
    "url": "/intro/a.html",
    "revision": "17a629df130e2c1ca259f42ca06fc901"
  },
  {
    "url": "/intro/b.html",
    "revision": "0a13f631f1c30616c03b9af90aae722f"
  },
  {
    "url": "/intro/c.html",
    "revision": "74413e02c18d5a03a23fce63640c37dc"
  },
  {
    "url": "/theme/favicon/safari-pinned-tab.svg",
    "revision": "1143884328fb4dc69fae54eac9eccfdb"
  },
  {
    "url": "/theme/icons/css/all.css",
    "revision": "ee8c65c3604b12ffbd3b7d093eeb8c32"
  },
  {
    "url": "/theme/icons/css/all.min.css",
    "revision": "597b70b2ce6b1483f72526c906918fe9"
  },
  {
    "url": "/theme/icons/css/brands.css",
    "revision": "127cb8f6670d4788d86e858190f64b31"
  },
  {
    "url": "/theme/icons/css/brands.min.css",
    "revision": "ab62d037fa1cdb0f8b5cb8de2bcd4a62"
  },
  {
    "url": "/theme/icons/css/fontawesome.css",
    "revision": "7e868d39994348a643753429713e0e08"
  },
  {
    "url": "/theme/icons/css/fontawesome.min.css",
    "revision": "7d2230b007a9313e4f6fe6326dfcb002"
  },
  {
    "url": "/theme/icons/css/regular.css",
    "revision": "4e45c3fc6f308783b395d41967320a56"
  },
  {
    "url": "/theme/icons/css/regular.min.css",
    "revision": "d80445041f6774d949debc12596067a8"
  },
  {
    "url": "/theme/icons/css/solid.css",
    "revision": "3259d50befcbe0f639262828073894ea"
  },
  {
    "url": "/theme/icons/css/solid.min.css",
    "revision": "129190453beb880efe8830b4706671ef"
  },
  {
    "url": "/theme/icons/css/svg-with-js.css",
    "revision": "ee683e04209d4f43ae596cf1141ff5e5"
  },
  {
    "url": "/theme/icons/css/svg-with-js.min.css",
    "revision": "e115adb8623097026038966528dd5ab6"
  },
  {
    "url": "/theme/icons/css/v4-shims.css",
    "revision": "28a04437e7ed02acb8618e4a588c68b9"
  },
  {
    "url": "/theme/icons/css/v4-shims.min.css",
    "revision": "01727b5056f65c2ac938f5db4e552b10"
  },
  {
    "url": "/theme/icons/webfonts/fa-brands-400.eot",
    "revision": "69b310edc4e366b06627596657ffd6e2"
  },
  {
    "url": "/theme/icons/webfonts/fa-brands-400.svg",
    "revision": "5da7e33c62be3559dce2c91476435e34"
  },
  {
    "url": "/theme/icons/webfonts/fa-brands-400.ttf",
    "revision": "d94572ddae31011adf538b407c99e8c1"
  },
  {
    "url": "/theme/icons/webfonts/fa-brands-400.woff",
    "revision": "e9f8333989a84d0bd403f6d15e717fb1"
  },
  {
    "url": "/theme/icons/webfonts/fa-brands-400.woff2",
    "revision": "66f625f1d99357cb1559bea25c827270"
  },
  {
    "url": "/theme/icons/webfonts/fa-regular-400.eot",
    "revision": "0b7928f6fbf544c473e51e6579da0bec"
  },
  {
    "url": "/theme/icons/webfonts/fa-regular-400.svg",
    "revision": "4e41caaf414b0335fc8219f0739a2adb"
  },
  {
    "url": "/theme/icons/webfonts/fa-regular-400.ttf",
    "revision": "cdd8fa76f79bbe1cd789e8b78831b2b0"
  },
  {
    "url": "/theme/icons/webfonts/fa-regular-400.woff",
    "revision": "d9e29124cc610631509da59240e8fc95"
  },
  {
    "url": "/theme/icons/webfonts/fa-regular-400.woff2",
    "revision": "930c12643983f664f026b6e65300f09d"
  },
  {
    "url": "/theme/icons/webfonts/fa-solid-900.eot",
    "revision": "0b93480e003507618e8e1198126a2d37"
  },
  {
    "url": "/theme/icons/webfonts/fa-solid-900.svg",
    "revision": "666a82cb3e9f8591bef4049aea26c4c6"
  },
  {
    "url": "/theme/icons/webfonts/fa-solid-900.ttf",
    "revision": "a7a790d499af8d37b9f742a666ab849c"
  },
  {
    "url": "/theme/icons/webfonts/fa-solid-900.woff",
    "revision": "dfc040d53fa343d2ba7ccb8217f34346"
  },
  {
    "url": "/theme/icons/webfonts/fa-solid-900.woff2",
    "revision": "e8a92a29978352517c450b9a800b06cb"
  },
  {
    "url": "/theme/manifest.json",
    "revision": "02985a6450fc8de739603ca98de80192"
  },
  {
    "url": "/welcome.html",
    "revision": "85e5eeca1e608c14c184260ac64265bf"
  },
  {
    "url": "/platform/controller.js",
    "revision": "b8f1c4aded6ed15e583da38f3b2327e58252409412b0a01cff1b5ec0543b169921661ab90f1aa121fb5f30d03647498f557381330c86ea8aae23585a1768c2ef439b535ce899310daaccb50f6e7d2640"
  },
  {
    "url": "/platform/map.css",
    "revision": "d1a8ab27978cdf7bb95502a041f0d6dba6df400ad01a751ea3a9ff3afe499c069b465e5f4c4d62749c489bcc8b88da62"
  },
  {
    "url": "/platform/map.js",
    "revision": "b8f1c4aded6ed15e583da38f3b2327e58a6ca7e8a00960f59e265e8a79e8559ecc6a9cb09c9a98afdd6a77ca6a295e0573ec3813dd667a6de2c94ae7a678717bfd490b1aac715917ece6d56a5de11e64"
  },
  {
    "url": "/platform/storage.js",
    "revision": "b8f1c4aded6ed15e583da38f3b2327e512d23e3295590b71657939cdb7aba4517799fac1cd9535e7246401d494e406d60964036fd761dca8f93da2499940fc4228ab5dc7da56d524505f9964cb3a51b16f3819893aa80e31363cf31b4606e9b7"
  },
  {
    "url": "/platform/util.js",
    "revision": "cb244ac52ed00f870faeab0135b68ea188dc09fa98a57f0e9e92bb33d41229fe"
  },
  {
    "url": "/platform/view.css",
    "revision": "83259ac6c435774eff2863d839d81a7831b296780e56df5cc874286465561613"
  },
  {
    "url": "/platform/view.js",
    "revision": "0a9285651bc1d594222ce0bb2e4c59885283b86cbf48a538ee3cbebac633ccd42424177957c131efab437d13ba8f28b2effe201de9d23aa2d1fc02e4e6837615"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

