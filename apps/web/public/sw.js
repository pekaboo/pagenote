var preCacheName = 'pre_cache'
var commonCacheName = 'common_cache'
var preCacheFiles = []
var version = "12"

var cacheRules = {
  whiteList: [],
  blockList: ['worker-register.js'],
}
var util = {
  checkIsDocument: function (request) {
    return request.destination === 'document'
  },
  checkIsHttp(request){
    return /^http/.test(request.url)
  },
  getCacheKey: function (request) {
    if (request.destination) {
      return request.destination
    }
    return commonCacheName
  },
  fetchAndCache: function (request) {
    return fetch(request).then((response) => {
      // 跨域的资源直接return
      if (!response || response.status !== 200) {
        return response
      }
      util.putCache(request, response.clone())
      return response
    }).catch(function (reason) {
      console.error(request.url,'worker fetch error', reason)
      throw reason
    })
  },
  putCache: function (request, resource) {
    // 非 http 请求，不支持 cache
    if(!util.checkIsHttp(request)){
      return;
    }
    caches.open(util.getCacheKey(request)).then((cache) => {
      cache.put(request, resource)
    })
  },
  checkAllowCache: function (request) {
    try {
      if (request.method !== 'GET') {
        return false
      }
      // 只缓存 http 请求
      if(!util.checkIsHttp(request)){
        return false
      }
      if(request.url.indexOf('disable_cache')> -1){
        return false;
      }
      /**黑名单，不用缓存*/
      var blockList = cacheRules.blockList || []
      for (let i in blockList) {
        try {
          var regex = new RegExp(blockList[i])
          if (regex.test(request.url)) {
            return false
          }
        } catch (e) {
          console.error('check error',blockList[i])
        }
      }

      /**静态资源，可安全使用缓存*/
      var isStatic = /\.(js|css|png|jpg|svg|woff|jpeg)/.test(request.url)
      var isDoucment = util.checkIsDocument(request)
      if (isStatic || isDoucment) {
        return true
      }

      /**白名单的其他 API 请求，可缓存*/
      for (let i in cacheRules.whiteList) {
        try {
          var whiteRegex = new RegExp(cacheRules.whiteList[i])
          if (whiteRegex.test(request.url)) {
            return true
          }
        } catch (e) {}
      }

      return false
    } catch (e) {
      console.error('check error', e)
      return false
    }
  },
  /**service worker 主动向页面发送消息*/
  sendMessageToDocument: function (data) {
    self.clients.matchAll().then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage(data)
      })
    })
  },
  /**response 是否相同比对*/
  checkSameResponse(oldResponse, newResponse) {
    var OldEtag = (oldResponse && oldResponse.headers)
        ? (oldResponse.headers.get('Etag') || oldResponse.headers.get('etag'))
        : '';
    var newEtag = newResponse.headers.get('Etag') || newResponse.headers.get('etag')

    return OldEtag === newEtag
  },
}

/**
 * 1. 监听install事件，安装完成后，进行文件缓存
 * **/
self.addEventListener('install', function (e) {
  console.log('Service Worker install',version)
  if(preCacheFiles.length){
    // 加载新缓存
    var cacheOpenPromise = caches.open(preCacheName).then(function (cache) {
      return cache.addAll(preCacheFiles)
    })
    e.waitUntil(cacheOpenPromise)
  }

  self.skipWaiting()
})

/**
 * 2. 当前版本sw.js 激活后，通过cache的key来判断是否更新cache中的静态资源
 * */
self.addEventListener('activate', function (e) {
  console.log('Service Worker 状态： activate',version)
  // 清空上一个版本的旧缓存
  var cachePromise = caches.keys().then(function (keys) {
    var deleteKey = keys.filter(function (key) {
      // 非白名单缓存 均清空
      return !['image', 'script', 'font', 'style','file'].includes(key)
    })
    return Promise.all(
        deleteKey.map(function (key) {
          console.log('remove cache：', key)
          return caches.delete(key)
        })
    )
  })


  e.waitUntil(cachePromise)
  /**
   * 注意不能忽略这行代码，否则第一次加载会导致fetch事件不触发。
   * 接管上一个 sw.js，正式激活本worker
   * */
  return self.clients.claim()
})

/**
 * 3. 代理网络请求
 * **/
self.addEventListener('fetch', function (e) {
  e.respondWith(
      caches
      .match(e.request)
      .then(function (response) {
        const allowCache = util.checkAllowCache(e.request)
        if (allowCache) {
          // 如果没有响应或者请求内容为 doc ,则需要保持最新，重新拉取
          var isDoc = util.checkIsDocument(e.request);
          var needRefreshCache = !response || isDoc;
          if (needRefreshCache) {
            // 如果是 document 请求，则传入 etag 标签，比较前后的差异
            setTimeout(function () {
              util.fetchAndCache(e.request).then(function (newResponse) {
                // 如果是 document 请求，则比较 etag 标签，判断是否需要更新，并通知主页面，提示用户
                if(isDoc){
                  var responseChanged = !util.checkSameResponse(response, newResponse)
                  if(responseChanged){
                    util.sendMessageToDocument({
                      type: 'out_of_date',
                      time: Date.now(),
                      header:{
                        senderURL: e.request.url,
                      },
                      data: {
                        url: e.request.url,
                      }
                    })
                  }
                }
              })
            },4000)
          }
          if (response) {
            return response
          }
        }
        return fetch(e.request)
      })
      .catch(function (err) {
        console.error(e.request.url,'sw fetch', err)
        return fetch(e.request)
      })
  )
})

/**
 * 与主线程的通信协议
 * */
self.addEventListener('message', function (e) {
  switch (e.data.type) {
    case 'clean_cache':
      if (e.data.key) {
        self.caches.delete(e.data.key)
      } else {
        self.caches.keys().then(function (keys) {
          keys.forEach(function (key) {
            self.caches.delete(key)
          })
        })
      }
      break
    case 'add_cache':
      if (e.data.values.length) {
        var key = e.data.key || commonCacheName
        caches.open(key).then(function (cache) {
          return cache.addAll(e.data.values)
        })
      }
      break
    case 'add_block':
      if (e.data.values.length) {
        cacheRules.blockList = cacheRules.blockList.concat(e.data.values)
      }
      break;
    default:
      console.warn('not support ', e.data)
  }
})
