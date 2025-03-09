// Copyright (c) 2025 Brian Kircher
//
// Open Source Software: you can modify and/or share it under the terms of the
// BSD license file in the root directory of this project.

const prefix = "fll-scorer-";

const cacheName = `${prefix}site-v2`;

const assets =
[
  "external/font-awesome-4.7.0/css/font-awesome.min.css",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.eot",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.svg",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.ttf",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.woff",
  "external/font-awesome-4.7.0/fonts/fontawesome-webfont.woff2",
  "external/jquery-3.7.1.min.js",
  "favicon.webp",
  "index.html",
  "no_touch.webp",
  "scorer.js",
  "seasons/2015/info.json",
  "seasons/2015/logo.webp",
  "seasons/2015/scoresheet.json",
  "seasons/2016/info.json",
  "seasons/2016/logo.webp",
  "seasons/2016/scoresheet.json",
  "seasons/2017/info.json",
  "seasons/2017/logo.webp",
  "seasons/2017/scoresheet.json",
  "seasons/2018/info.json",
  "seasons/2018/logo.webp",
  "seasons/2018/scoresheet.json",
  "seasons/2019/info.json",
  "seasons/2019/logo.webp",
  "seasons/2019/scoresheet.json",
  "seasons/2020/info.json",
  "seasons/2020/logo.webp",
  "seasons/2020/scoresheet.json",
  "seasons/2021/info.json",
  "seasons/2021/logo.webp",
  "seasons/2021/scoresheet.json",
  "seasons/2022/info.json",
  "seasons/2022/logo.webp",
  "seasons/2022/scoresheet.json",
  "seasons/2023/info.json",
  "seasons/2023/logo.webp",
  "seasons/2023/scoresheet.json",
  "seasons/2024/info.json",
  "seasons/2024/logo.webp",
  "seasons/2024/scoresheet.json",
  "seasons/2025/info.json",
  "seasons/2025/logo.gif",
  "seasons/2025/logo.webp",
  "seasons/2025/scoresheet.json",
  "styles.css",
  "sw.js",
];

self.addEventListener("install", evt => {
  evt.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  )
});

self.addEventListener("activate", async evt => {
  evt.waitUntil(
    caches.keys().then(cacheList => {
      return(Promise.all(
        cacheList.map(cache => {
          if((cache.substring(0, prefix.length) === prefix) &&
             (cache !== cacheName)) {
            return(caches.delete(cache));
          }
        })
      ));
    })
  )
});

self.addEventListener("fetch", evt => {
  evt.respondWith(
    caches.match(evt.request).then(res => {
      return(res || fetch(evt.request));
    })
  );
});