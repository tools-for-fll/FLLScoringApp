// Copyright (c) 2025 Brian Kircher
//
// Open Source Software: you can modify and/or share it under the terms of the
// BSD license file in the root directory of this project.

const cacheName = `fll-scorer-site-v1`;

const assets =
[
  "external/font-awesome-4.7.0/css/font-awesome.min.css",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.eot",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.svg",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.ttf",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.woff",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.woff2",
  "external/jquery-3.7.1.min.js",
  "favicon.png",
  "icons/icon-128x128.png",
  "icons/icon-144x144.png",
  "icons/icon-152x152.png",
  "icons/icon-192x192.png",
  "icons/icon-384x384.png",
  "icons/icon-512x512.png",
  "icons/icon-72x72.png",
  "icons/icon-96x96.png",
  "index.html",
  "manifest.webmanifest",
  "no_touch.png",
  "scorer.js",
  "seasons/2015/info.json",
  "seasons/2015/logo.png",
  "seasons/2015/scoresheet.json",
  "seasons/2016/info.json",
  "seasons/2016/logo.png",
  "seasons/2016/scoresheet.json",
  "seasons/2017/info.json",
  "seasons/2017/logo.png",
  "seasons/2017/scoresheet.json",
  "seasons/2018/info.json",
  "seasons/2018/logo.png",
  "seasons/2018/scoresheet.json",
  "seasons/2019/info.json",
  "seasons/2019/logo.png",
  "seasons/2019/scoresheet.json",
  "seasons/2020/info.json",
  "seasons/2020/logo.png",
  "seasons/2020/scoresheet.json",
  "seasons/2021/info.json",
  "seasons/2021/logo.png",
  "seasons/2021/scoresheet.json",
  "seasons/2022/info.json",
  "seasons/2022/logo.png",
  "seasons/2022/scoresheet.json",
  "seasons/2023/info.json",
  "seasons/2023/logo.png",
  "seasons/2023/scoresheet.json",
  "seasons/2024/info.json",
  "seasons/2024/logo.png",
  "seasons/2024/scoresheet.json",
  "seasons/2025/info.json",
  "seasons/2025/logo.gif",
  "seasons/2025/logo.png",
  "seasons/2025/scoresheet.json",
  "styles.css",
  "sw.js",
];

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  )
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return(res || fetch(fetchEvent.request));
    })
  );
});