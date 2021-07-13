var doc = document;
var body, video, container;
var state = {
  code: -1,
  msg: '',
  events: []
};

(function() {
  var stateV = {
    code: -1,
    msg: ''
  };
  Object.defineProperty(state, "msg", {
    get: function() {
      return stateV.msg;
    },
    set: function(newValue) {
      stateV.msg = newValue;

//    var stack;
//    try {
//      a.b.c();
//    } catch(e) {
//      stack = e.stack;
//    }
//    if(stack) {
//      var src = stack.match(/\((\S+)\)/g)[1].replace(/^\(|\)$/g, '');
//      console.log(newValue, '(追踪地址: ' + src + ')');
//    }
    }
  });

  Object.defineProperty(state, "code", {
    get: function() {
      return stateV.code;
    },
    set: function(newValue) {
      stateV.code = newValue;
      var next = state.events[newValue];
      next && next();
    }
  });
})();
//
var camera, scene, renderer, stats;

function eventOne(dom, ev, fn) {
  if(typeof dom === 'string') {
    dom = document.querySelector(dom);
  };
  var oneFn = function() {
    dom.removeEventListener(ev, oneFn, false);
    fn.apply(this, arguments);
  };
  dom.addEventListener(ev, oneFn, false);
};

(function(doc) {
  var loadedEnd = false;
  doc.addEventListener('DOMContentLoaded', function() {
    loadedEnd = true;
  }, false);
  doc.ready = function(callback) {
    if(loadedEnd) {
      callback();
    } else {
      doc.addEventListener('DOMContentLoaded', callback, false);
    }
  };
})(document);

doc.ready(function() {
  body = document.querySelector('body');
  video = document.querySelector('#video');
  container = document.querySelector('#three-container');

  eventOne(body, 'click', function() {
    if(video.paused) {
      video.play();
      state.msg = '开始播放视屏';
    }
  });
  // if(video.paused) {
  //   video.play();
  // };
  // if(!video.paused) {
  //   state.msg = '开始播放视屏';
  // };
  if(true/* video.paused */) {
    var bnt_d = document.createElement('div');
    bnt_d.style = 'position: absolute;z-index: 99;top: 50px;margin-left: -40px;width: 100%;text-align: center;';
    bnt_d.innerHTML = '<button id="startButton">Click to Play</button>';
    body.appendChild(bnt_d);
    eventOne(body, 'click', function() {
      bnt_d.remove();
    });
  };

});

window.browserInfo = (function() {
  var WIN = window,
    LOC = WIN["location"],
    NA = WIN.navigator,
    UA = NA.userAgent.toLowerCase();

  var browserInfo = {
    ie: !!(WIN.ActiveXObject || "ActiveXObject" in WIN) && ((UA.match(/msie\s(\d+)/) || [])[1] || "11"),
    ff: /firefox/.test(UA),
    chrome: /chrome/.test(UA),
    opera: /opera/.test(UA),
    safari: /apple computer/.test(UA),
    webkit: /webkit/.test(UA),
    mobile: /iphone|ipod|ipad|android|webos|blackberry|opera mini|opera mobi|iemobile/.test(UA),
    pc: !/iphone|ipod|ipad|android|webos|blackberry|opera mini|opera mobi|iemobile/.test(UA),

    windows: /windows/.test(UA),
    mac: /mac/.test(UA),
    android: /android|htc/.test(UA) || /linux/i.test(NA.platform + ''),
    ios: /iphone|ipod|ipad|ios/.test(UA),
    linux: /linux/.test(UA),

    weixin: /micromessenger/.test(UA),
    uc: /UC/.test(NA.userAgent),
    qq: /mqqbrowser/.test(UA),
  };

  return browserInfo;
})();