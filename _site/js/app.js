(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _zenscroll = _interopRequireDefault(require("./libs/zenscroll"));
var _waypoints = _interopRequireDefault(require("./libs/waypoints"));
var _photoswipe = _interopRequireDefault(require("./libs/photoswipe"));
var _photoswipeUiDefault = _interopRequireDefault(require("./libs/photoswipe-ui-default"));
var _primaryNav = _interopRequireDefault(require("./modules/primary-nav"));
var _timelineLoading = _interopRequireDefault(require("./modules/timeline-loading"));
var _importCustomFont = _interopRequireDefault(require("./modules/import-custom-font"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// libraries

// modules

(0, _primaryNav["default"])();
(0, _timelineLoading["default"])();
(0, _importCustomFont["default"])();

// Photoswipe
var initPhotoSwipeFromDOM = function initPhotoSwipeFromDOM(gallerySelector) {
  var parseThumbnailElements = function parseThumbnailElements(el) {
    var thumbElements = el.childNodes,
      numNodes = thumbElements.length,
      items = [],
      el,
      childElements,
      thumbnailEl,
      size,
      item;
    for (var i = 0; i < numNodes; i++) {
      el = thumbElements[i];

      // include only element nodes
      if (el.nodeType !== 1) {
        continue;
      }
      childElements = el.children;
      size = el.getAttribute('data-size').split('x');

      // create slide object
      item = {
        src: el.getAttribute('href'),
        w: parseInt(size[0], 10),
        h: parseInt(size[1], 10),
        author: el.getAttribute('data-author')
      };
      item.el = el; // save link to element for getThumbBoundsFn

      if (childElements.length > 0) {
        item.msrc = childElements[0].getAttribute('src'); // thumbnail url
        if (childElements.length > 1) {
          item.title = childElements[1].innerHTML; // caption (contents of figure)
        }
      }
      var mediumSrc = el.getAttribute('data-med');
      if (mediumSrc) {
        size = el.getAttribute('data-med-size').split('x');
        // "medium-sized" image
        item.m = {
          src: mediumSrc,
          w: parseInt(size[0], 10),
          h: parseInt(size[1], 10)
        };
      }
      // original image
      item.o = {
        src: item.src,
        w: item.w,
        h: item.h
      };
      items.push(item);
    }
    return items;
  };

  // find nearest parent element
  var closest = function closest(el, fn) {
    return el && (fn(el) ? el : closest(el.parentNode, fn));
  };
  var onThumbnailsClick = function onThumbnailsClick(e) {
    debugger;
    e = e || window.event;
    e.preventDefault ? e.preventDefault() : e.returnValue = false;
    var eTarget = e.target || e.srcElement;
    var clickedListItem = closest(eTarget, function (el) {
      return el.tagName === 'A';
    });
    if (!clickedListItem) {
      return;
    }
    var clickedGallery = clickedListItem.parentNode;
    var childNodes = clickedListItem.parentNode.childNodes,
      numChildNodes = childNodes.length,
      nodeIndex = 0,
      index;
    for (var i = 0; i < numChildNodes; i++) {
      if (childNodes[i].nodeType !== 1) {
        continue;
      }
      if (childNodes[i] === clickedListItem) {
        index = nodeIndex;
        break;
      }
      nodeIndex++;
    }
    if (index >= 0) {
      openPhotoSwipe(index, clickedGallery);
    }
    return false;
  };
  var photoswipeParseHash = function photoswipeParseHash() {
    var hash = window.location.hash.substring(1),
      params = {};
    if (hash.length < 5) {
      // pid=1
      return params;
    }
    var vars = hash.split('&');
    for (var i = 0; i < vars.length; i++) {
      if (!vars[i]) {
        continue;
      }
      var pair = vars[i].split('=');
      if (pair.length < 2) {
        continue;
      }
      params[pair[0]] = pair[1];
    }
    if (params.gid) {
      params.gid = parseInt(params.gid, 10);
    }
    return params;
  };
  var openPhotoSwipe = function openPhotoSwipe(index, galleryElement, disableAnimation, fromURL) {
    var pswpElement = document.querySelectorAll('.pswp')[0],
      gallery,
      options,
      items;
    items = parseThumbnailElements(galleryElement);

    // define options (if needed)
    options = {
      galleryUID: galleryElement.getAttribute('data-pswp-uid'),
      getThumbBoundsFn: function getThumbBoundsFn(index) {
        // See Options->getThumbBoundsFn section of docs for more info
        var thumbnail = items[index].el.children[0],
          pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
          rect = thumbnail.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top + pageYScroll,
          w: rect.width
        };
      },
      addCaptionHTMLFn: function addCaptionHTMLFn(item, captionEl, isFake) {
        if (!item.title) {
          captionEl.children[0].innerText = '';
          return false;
        }
        captionEl.children[0].innerHTML = item.title + '<br/><small>Photo: ' + item.author + '</small>';
        return true;
      }
    };
    if (fromURL) {
      if (options.galleryPIDs) {
        // parse real index when custom PIDs are used
        // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
        for (var j = 0; j < items.length; j++) {
          if (items[j].pid == index) {
            options.index = j;
            break;
          }
        }
      } else {
        options.index = parseInt(index, 10) - 1;
      }
    } else {
      options.index = parseInt(index, 10);
    }

    // exit if index not found
    if (isNaN(options.index)) {
      return;
    }
    if (disableAnimation) {
      options.showAnimationDuration = 0;
    }

    // Pass data to PhotoSwipe and initialize it
    gallery = new _photoswipe["default"](pswpElement, _photoswipeUiDefault["default"], items, options);

    // see: http://photoswipe.com/documentation/responsive-images.html
    var realViewportWidth,
      useLargeImages = false,
      firstResize = true,
      imageSrcWillChange;
    gallery.listen('beforeResize', function () {
      var dpiRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
      dpiRatio = Math.min(dpiRatio, 2.5);
      realViewportWidth = gallery.viewportSize.x * dpiRatio;
      if (realViewportWidth >= 1200 || !gallery.likelyTouchDevice && realViewportWidth > 800 || screen.width > 1200) {
        if (!useLargeImages) {
          useLargeImages = true;
          imageSrcWillChange = true;
        }
      } else {
        if (useLargeImages) {
          useLargeImages = false;
          imageSrcWillChange = true;
        }
      }
      if (imageSrcWillChange && !firstResize) {
        gallery.invalidateCurrItems();
      }
      if (firstResize) {
        firstResize = false;
      }
      imageSrcWillChange = false;
    });
    gallery.listen('gettingData', function (index, item) {
      if (useLargeImages) {
        item.src = item.o.src;
        item.w = item.o.w;
        item.h = item.o.h;
      } else {
        item.src = item.m.src;
        item.w = item.m.w;
        item.h = item.m.h;
      }
    });
    gallery.init();
  };

  // select all gallery elements
  var galleryElements = document.querySelectorAll(gallerySelector);
  for (var i = 0, l = galleryElements.length; i < l; i++) {
    galleryElements[i].setAttribute('data-pswp-uid', i + 1);
    galleryElements[i].onclick = onThumbnailsClick;
  }

  // Parse URL and open gallery if it contains #&pid=3&gid=1
  var hashData = photoswipeParseHash();
  if (hashData.pid && hashData.gid) {
    openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
  }
};
initPhotoSwipeFromDOM('.gallery');

},{"./libs/photoswipe":3,"./libs/photoswipe-ui-default":2,"./libs/waypoints":4,"./libs/zenscroll":5,"./modules/import-custom-font":6,"./modules/primary-nav":7,"./modules/timeline-loading":8}],2:[function(require,module,exports){
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/*! PhotoSwipe Default UI - 4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
/**
*
* UI on top of main sliding area (caption, arrows, close button, etc.).
* Built just using public methods/properties of PhotoSwipe.
*
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
    module.exports = factory();
  } else {
    root.PhotoSwipeUI_Default = factory();
  }
})(void 0, function () {
  'use strict';

  var PhotoSwipeUI_Default = function PhotoSwipeUI_Default(pswp, framework) {
    var ui = this;
    var _overlayUIUpdated = false,
      _controlsVisible = true,
      _fullscrenAPI,
      _controls,
      _captionContainer,
      _fakeCaptionContainer,
      _indexIndicator,
      _shareButton,
      _shareModal,
      _shareModalHidden = true,
      _initalCloseOnScrollValue,
      _isIdle,
      _listen,
      _loadingIndicator,
      _loadingIndicatorHidden,
      _loadingIndicatorTimeout,
      _galleryHasOneSlide,
      _options,
      _defaultUIOptions = {
        barsSize: {
          top: 44,
          bottom: 'auto'
        },
        closeElClasses: ['item', 'caption', 'zoom-wrap', 'ui', 'top-bar'],
        timeToIdle: 4000,
        timeToIdleOutside: 1000,
        loadingIndicatorDelay: 1000,
        // 2s

        addCaptionHTMLFn: function addCaptionHTMLFn(item, captionEl /*, isFake */) {
          if (!item.title) {
            captionEl.children[0].innerHTML = '';
            return false;
          }
          captionEl.children[0].innerHTML = item.title;
          return true;
        },
        closeEl: true,
        captionEl: true,
        fullscreenEl: true,
        zoomEl: true,
        shareEl: true,
        counterEl: true,
        arrowEl: true,
        preloaderEl: true,
        tapToClose: false,
        tapToToggleControls: true,
        clickToCloseNonZoomable: true,
        shareButtons: [{
          id: 'facebook',
          label: 'Share on Facebook',
          url: 'https://www.facebook.com/sharer/sharer.php?u={{url}}'
        }, {
          id: 'twitter',
          label: 'Tweet',
          url: 'https://twitter.com/intent/tweet?text={{text}}&url={{url}}'
        }, {
          id: 'download',
          label: 'Download image',
          url: '{{raw_image_url}}',
          download: true
        }],
        getImageURLForShare: function getImageURLForShare(/* shareButtonData */
        ) {
          return pswp.currItem.src || '';
        },
        getPageURLForShare: function getPageURLForShare(/* shareButtonData */
        ) {
          return window.location.href;
        },
        getTextForShare: function getTextForShare(/* shareButtonData */
        ) {
          return pswp.currItem.title || '';
        },
        indexIndicatorSep: ' / ',
        fitControlsWidth: 1200
      },
      _blockControlsTap,
      _blockControlsTapTimeout;
    var _onControlsTap = function _onControlsTap(e) {
        if (_blockControlsTap) {
          return true;
        }
        e = e || window.event;
        if (_options.timeToIdle && _options.mouseUsed && !_isIdle) {
          // reset idle timer
          _onIdleMouseMove();
        }
        var target = e.target || e.srcElement,
          uiElement,
          clickedClass = target.getAttribute('class') || '',
          found;
        for (var i = 0; i < _uiElements.length; i++) {
          uiElement = _uiElements[i];
          if (uiElement.onTap && clickedClass.indexOf('pswp__' + uiElement.name) > -1) {
            uiElement.onTap();
            found = true;
          }
        }
        if (found) {
          if (e.stopPropagation) {
            e.stopPropagation();
          }
          _blockControlsTap = true;

          // Some versions of Android don't prevent ghost click event
          // when preventDefault() was called on touchstart and/or touchend.
          //
          // This happens on v4.3, 4.2, 4.1,
          // older versions strangely work correctly,
          // but just in case we add delay on all of them)
          var tapDelay = framework.features.isOldAndroid ? 600 : 30;
          _blockControlsTapTimeout = setTimeout(function () {
            _blockControlsTap = false;
          }, tapDelay);
        }
      },
      _fitControlsInViewport = function _fitControlsInViewport() {
        return !pswp.likelyTouchDevice || _options.mouseUsed || screen.width > _options.fitControlsWidth;
      },
      _togglePswpClass = function _togglePswpClass(el, cName, add) {
        framework[(add ? 'add' : 'remove') + 'Class'](el, 'pswp__' + cName);
      },
      // add class when there is just one item in the gallery
      // (by default it hides left/right arrows and 1ofX counter)
      _countNumItems = function _countNumItems() {
        var hasOneSlide = _options.getNumItemsFn() === 1;
        if (hasOneSlide !== _galleryHasOneSlide) {
          _togglePswpClass(_controls, 'ui--one-slide', hasOneSlide);
          _galleryHasOneSlide = hasOneSlide;
        }
      },
      _toggleShareModalClass = function _toggleShareModalClass() {
        _togglePswpClass(_shareModal, 'share-modal--hidden', _shareModalHidden);
      },
      _toggleShareModal = function _toggleShareModal() {
        _shareModalHidden = !_shareModalHidden;
        if (!_shareModalHidden) {
          _toggleShareModalClass();
          setTimeout(function () {
            if (!_shareModalHidden) {
              framework.addClass(_shareModal, 'pswp__share-modal--fade-in');
            }
          }, 30);
        } else {
          framework.removeClass(_shareModal, 'pswp__share-modal--fade-in');
          setTimeout(function () {
            if (_shareModalHidden) {
              _toggleShareModalClass();
            }
          }, 300);
        }
        if (!_shareModalHidden) {
          _updateShareURLs();
        }
        return false;
      },
      _openWindowPopup = function _openWindowPopup(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        pswp.shout('shareLinkClick', e, target);
        if (!target.href) {
          return false;
        }
        if (target.hasAttribute('download')) {
          return true;
        }
        window.open(target.href, 'pswp_share', 'scrollbars=yes,resizable=yes,toolbar=no,' + 'location=yes,width=550,height=420,top=100,left=' + (window.screen ? Math.round(screen.width / 2 - 275) : 100));
        if (!_shareModalHidden) {
          _toggleShareModal();
        }
        return false;
      },
      _updateShareURLs = function _updateShareURLs() {
        var shareButtonOut = '',
          shareButtonData,
          shareURL,
          image_url,
          page_url,
          share_text;
        for (var i = 0; i < _options.shareButtons.length; i++) {
          shareButtonData = _options.shareButtons[i];
          image_url = _options.getImageURLForShare(shareButtonData);
          page_url = _options.getPageURLForShare(shareButtonData);
          share_text = _options.getTextForShare(shareButtonData);
          shareURL = shareButtonData.url.replace('{{url}}', encodeURIComponent(page_url)).replace('{{image_url}}', encodeURIComponent(image_url)).replace('{{raw_image_url}}', image_url).replace('{{text}}', encodeURIComponent(share_text));
          shareButtonOut += '<a href="' + shareURL + '" target="_blank" ' + 'class="pswp__share--' + shareButtonData.id + '"' + (shareButtonData.download ? 'download' : '') + '>' + shareButtonData.label + '</a>';
          if (_options.parseShareButtonOut) {
            shareButtonOut = _options.parseShareButtonOut(shareButtonData, shareButtonOut);
          }
        }
        _shareModal.children[0].innerHTML = shareButtonOut;
        _shareModal.children[0].onclick = _openWindowPopup;
      },
      _hasCloseClass = function _hasCloseClass(target) {
        for (var i = 0; i < _options.closeElClasses.length; i++) {
          if (framework.hasClass(target, 'pswp__' + _options.closeElClasses[i])) {
            return true;
          }
        }
      },
      _idleInterval,
      _idleTimer,
      _idleIncrement = 0,
      _onIdleMouseMove = function _onIdleMouseMove() {
        clearTimeout(_idleTimer);
        _idleIncrement = 0;
        if (_isIdle) {
          ui.setIdle(false);
        }
      },
      _onMouseLeaveWindow = function _onMouseLeaveWindow(e) {
        e = e ? e : window.event;
        var from = e.relatedTarget || e.toElement;
        if (!from || from.nodeName === 'HTML') {
          clearTimeout(_idleTimer);
          _idleTimer = setTimeout(function () {
            ui.setIdle(true);
          }, _options.timeToIdleOutside);
        }
      },
      _setupFullscreenAPI = function _setupFullscreenAPI() {
        if (_options.fullscreenEl && !framework.features.isOldAndroid) {
          if (!_fullscrenAPI) {
            _fullscrenAPI = ui.getFullscreenAPI();
          }
          if (_fullscrenAPI) {
            framework.bind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
            ui.updateFullscreen();
            framework.addClass(pswp.template, 'pswp--supports-fs');
          } else {
            framework.removeClass(pswp.template, 'pswp--supports-fs');
          }
        }
      },
      _setupLoadingIndicator = function _setupLoadingIndicator() {
        // Setup loading indicator
        if (_options.preloaderEl) {
          _toggleLoadingIndicator(true);
          _listen('beforeChange', function () {
            clearTimeout(_loadingIndicatorTimeout);

            // display loading indicator with delay
            _loadingIndicatorTimeout = setTimeout(function () {
              if (pswp.currItem && pswp.currItem.loading) {
                if (!pswp.allowProgressiveImg() || pswp.currItem.img && !pswp.currItem.img.naturalWidth) {
                  // show preloader if progressive loading is not enabled,
                  // or image width is not defined yet (because of slow connection)
                  _toggleLoadingIndicator(false);
                  // items-controller.js function allowProgressiveImg
                }
              } else {
                _toggleLoadingIndicator(true); // hide preloader
              }
            }, _options.loadingIndicatorDelay);
          });
          _listen('imageLoadComplete', function (index, item) {
            if (pswp.currItem === item) {
              _toggleLoadingIndicator(true);
            }
          });
        }
      },
      _toggleLoadingIndicator = function _toggleLoadingIndicator(hide) {
        if (_loadingIndicatorHidden !== hide) {
          _togglePswpClass(_loadingIndicator, 'preloader--active', !hide);
          _loadingIndicatorHidden = hide;
        }
      },
      _applyNavBarGaps = function _applyNavBarGaps(item) {
        var gap = item.vGap;
        if (_fitControlsInViewport()) {
          var bars = _options.barsSize;
          if (_options.captionEl && bars.bottom === 'auto') {
            if (!_fakeCaptionContainer) {
              _fakeCaptionContainer = framework.createEl('pswp__caption pswp__caption--fake');
              _fakeCaptionContainer.appendChild(framework.createEl('pswp__caption__center'));
              _controls.insertBefore(_fakeCaptionContainer, _captionContainer);
              framework.addClass(_controls, 'pswp__ui--fit');
            }
            if (_options.addCaptionHTMLFn(item, _fakeCaptionContainer, true)) {
              var captionSize = _fakeCaptionContainer.clientHeight;
              gap.bottom = parseInt(captionSize, 10) || 44;
            } else {
              gap.bottom = bars.top; // if no caption, set size of bottom gap to size of top
            }
          } else {
            gap.bottom = bars.bottom === 'auto' ? 0 : bars.bottom;
          }

          // height of top bar is static, no need to calculate it
          gap.top = bars.top;
        } else {
          gap.top = gap.bottom = 0;
        }
      },
      _setupIdle = function _setupIdle() {
        // Hide controls when mouse is used
        if (_options.timeToIdle) {
          _listen('mouseUsed', function () {
            framework.bind(document, 'mousemove', _onIdleMouseMove);
            framework.bind(document, 'mouseout', _onMouseLeaveWindow);
            _idleInterval = setInterval(function () {
              _idleIncrement++;
              if (_idleIncrement === 2) {
                ui.setIdle(true);
              }
            }, _options.timeToIdle / 2);
          });
        }
      },
      _setupHidingControlsDuringGestures = function _setupHidingControlsDuringGestures() {
        // Hide controls on vertical drag
        _listen('onVerticalDrag', function (now) {
          if (_controlsVisible && now < 0.95) {
            ui.hideControls();
          } else if (!_controlsVisible && now >= 0.95) {
            ui.showControls();
          }
        });

        // Hide controls when pinching to close
        var pinchControlsHidden;
        _listen('onPinchClose', function (now) {
          if (_controlsVisible && now < 0.9) {
            ui.hideControls();
            pinchControlsHidden = true;
          } else if (pinchControlsHidden && !_controlsVisible && now > 0.9) {
            ui.showControls();
          }
        });
        _listen('zoomGestureEnded', function () {
          pinchControlsHidden = false;
          if (pinchControlsHidden && !_controlsVisible) {
            ui.showControls();
          }
        });
      };
    var _uiElements = [{
      name: 'caption',
      option: 'captionEl',
      onInit: function onInit(el) {
        _captionContainer = el;
      }
    }, {
      name: 'share-modal',
      option: 'shareEl',
      onInit: function onInit(el) {
        _shareModal = el;
      },
      onTap: function onTap() {
        _toggleShareModal();
      }
    }, {
      name: 'button--share',
      option: 'shareEl',
      onInit: function onInit(el) {
        _shareButton = el;
      },
      onTap: function onTap() {
        _toggleShareModal();
      }
    }, {
      name: 'button--zoom',
      option: 'zoomEl',
      onTap: pswp.toggleDesktopZoom
    }, {
      name: 'counter',
      option: 'counterEl',
      onInit: function onInit(el) {
        _indexIndicator = el;
      }
    }, {
      name: 'button--close',
      option: 'closeEl',
      onTap: pswp.close
    }, {
      name: 'button--arrow--left',
      option: 'arrowEl',
      onTap: pswp.prev
    }, {
      name: 'button--arrow--right',
      option: 'arrowEl',
      onTap: pswp.next
    }, {
      name: 'button--fs',
      option: 'fullscreenEl',
      onTap: function onTap() {
        if (_fullscrenAPI.isFullscreen()) {
          _fullscrenAPI.exit();
        } else {
          _fullscrenAPI.enter();
        }
      }
    }, {
      name: 'preloader',
      option: 'preloaderEl',
      onInit: function onInit(el) {
        _loadingIndicator = el;
      }
    }];
    var _setupUIElements = function _setupUIElements() {
      var item, classAttr, uiElement;
      var loopThroughChildElements = function loopThroughChildElements(sChildren) {
        if (!sChildren) {
          return;
        }
        var l = sChildren.length;
        for (var i = 0; i < l; i++) {
          item = sChildren[i];
          classAttr = item.className;
          for (var a = 0; a < _uiElements.length; a++) {
            uiElement = _uiElements[a];
            if (classAttr.indexOf('pswp__' + uiElement.name) > -1) {
              if (_options[uiElement.option]) {
                // if element is not disabled from options

                framework.removeClass(item, 'pswp__element--disabled');
                if (uiElement.onInit) {
                  uiElement.onInit(item);
                }

                //item.style.display = 'block';
              } else {
                framework.addClass(item, 'pswp__element--disabled');
                //item.style.display = 'none';
              }
            }
          }
        }
      };
      loopThroughChildElements(_controls.children);
      var topBar = framework.getChildByClass(_controls, 'pswp__top-bar');
      if (topBar) {
        loopThroughChildElements(topBar.children);
      }
    };
    ui.init = function () {
      // extend options
      framework.extend(pswp.options, _defaultUIOptions, true);

      // create local link for fast access
      _options = pswp.options;

      // find pswp__ui element
      _controls = framework.getChildByClass(pswp.scrollWrap, 'pswp__ui');

      // create local link
      _listen = pswp.listen;
      _setupHidingControlsDuringGestures();

      // update controls when slides change
      _listen('beforeChange', ui.update);

      // toggle zoom on double-tap
      _listen('doubleTap', function (point) {
        var initialZoomLevel = pswp.currItem.initialZoomLevel;
        if (pswp.getZoomLevel() !== initialZoomLevel) {
          pswp.zoomTo(initialZoomLevel, point, 333);
        } else {
          pswp.zoomTo(_options.getDoubleTapZoom(false, pswp.currItem), point, 333);
        }
      });

      // Allow text selection in caption
      _listen('preventDragEvent', function (e, isDown, preventObj) {
        var t = e.target || e.srcElement;
        if (t && t.getAttribute('class') && e.type.indexOf('mouse') > -1 && (t.getAttribute('class').indexOf('__caption') > 0 || /(SMALL|STRONG|EM)/i.test(t.tagName))) {
          preventObj.prevent = false;
        }
      });

      // bind events for UI
      _listen('bindEvents', function () {
        framework.bind(_controls, 'pswpTap click', _onControlsTap);
        framework.bind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);
        if (!pswp.likelyTouchDevice) {
          framework.bind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);
        }
      });

      // unbind events for UI
      _listen('unbindEvents', function () {
        if (!_shareModalHidden) {
          _toggleShareModal();
        }
        if (_idleInterval) {
          clearInterval(_idleInterval);
        }
        framework.unbind(document, 'mouseout', _onMouseLeaveWindow);
        framework.unbind(document, 'mousemove', _onIdleMouseMove);
        framework.unbind(_controls, 'pswpTap click', _onControlsTap);
        framework.unbind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);
        framework.unbind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);
        if (_fullscrenAPI) {
          framework.unbind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
          if (_fullscrenAPI.isFullscreen()) {
            _options.hideAnimationDuration = 0;
            _fullscrenAPI.exit();
          }
          _fullscrenAPI = null;
        }
      });

      // clean up things when gallery is destroyed
      _listen('destroy', function () {
        if (_options.captionEl) {
          if (_fakeCaptionContainer) {
            _controls.removeChild(_fakeCaptionContainer);
          }
          framework.removeClass(_captionContainer, 'pswp__caption--empty');
        }
        if (_shareModal) {
          _shareModal.children[0].onclick = null;
        }
        framework.removeClass(_controls, 'pswp__ui--over-close');
        framework.addClass(_controls, 'pswp__ui--hidden');
        ui.setIdle(false);
      });
      if (!_options.showAnimationDuration) {
        framework.removeClass(_controls, 'pswp__ui--hidden');
      }
      _listen('initialZoomIn', function () {
        if (_options.showAnimationDuration) {
          framework.removeClass(_controls, 'pswp__ui--hidden');
        }
      });
      _listen('initialZoomOut', function () {
        framework.addClass(_controls, 'pswp__ui--hidden');
      });
      _listen('parseVerticalMargin', _applyNavBarGaps);
      _setupUIElements();
      if (_options.shareEl && _shareButton && _shareModal) {
        _shareModalHidden = true;
      }
      _countNumItems();
      _setupIdle();
      _setupFullscreenAPI();
      _setupLoadingIndicator();
    };
    ui.setIdle = function (isIdle) {
      _isIdle = isIdle;
      _togglePswpClass(_controls, 'ui--idle', isIdle);
    };
    ui.update = function () {
      // Don't update UI if it's hidden
      if (_controlsVisible && pswp.currItem) {
        ui.updateIndexIndicator();
        if (_options.captionEl) {
          _options.addCaptionHTMLFn(pswp.currItem, _captionContainer);
          _togglePswpClass(_captionContainer, 'caption--empty', !pswp.currItem.title);
        }
        _overlayUIUpdated = true;
      } else {
        _overlayUIUpdated = false;
      }
      if (!_shareModalHidden) {
        _toggleShareModal();
      }
      _countNumItems();
    };
    ui.updateFullscreen = function (e) {
      if (e) {
        // some browsers change window scroll position during the fullscreen
        // so PhotoSwipe updates it just in case
        setTimeout(function () {
          pswp.setScrollOffset(0, framework.getScrollY());
        }, 50);
      }

      // toogle pswp--fs class on root element
      framework[(_fullscrenAPI.isFullscreen() ? 'add' : 'remove') + 'Class'](pswp.template, 'pswp--fs');
    };
    ui.updateIndexIndicator = function () {
      if (_options.counterEl) {
        _indexIndicator.innerHTML = pswp.getCurrentIndex() + 1 + _options.indexIndicatorSep + _options.getNumItemsFn();
      }
    };
    ui.onGlobalTap = function (e) {
      e = e || window.event;
      var target = e.target || e.srcElement;
      if (_blockControlsTap) {
        return;
      }
      if (e.detail && e.detail.pointerType === 'mouse') {
        // close gallery if clicked outside of the image
        if (_hasCloseClass(target)) {
          pswp.close();
          return;
        }
        if (framework.hasClass(target, 'pswp__img')) {
          if (pswp.getZoomLevel() === 1 && pswp.getZoomLevel() <= pswp.currItem.fitRatio) {
            if (_options.clickToCloseNonZoomable) {
              pswp.close();
            }
          } else {
            pswp.toggleDesktopZoom(e.detail.releasePoint);
          }
        }
      } else {
        // tap anywhere (except buttons) to toggle visibility of controls
        if (_options.tapToToggleControls) {
          if (_controlsVisible) {
            ui.hideControls();
          } else {
            ui.showControls();
          }
        }

        // tap to close gallery
        if (_options.tapToClose && (framework.hasClass(target, 'pswp__img') || _hasCloseClass(target))) {
          pswp.close();
          return;
        }
      }
    };
    ui.onMouseOver = function (e) {
      e = e || window.event;
      var target = e.target || e.srcElement;

      // add class when mouse is over an element that should close the gallery
      _togglePswpClass(_controls, 'ui--over-close', _hasCloseClass(target));
    };
    ui.hideControls = function () {
      framework.addClass(_controls, 'pswp__ui--hidden');
      _controlsVisible = false;
    };
    ui.showControls = function () {
      _controlsVisible = true;
      if (!_overlayUIUpdated) {
        ui.update();
      }
      framework.removeClass(_controls, 'pswp__ui--hidden');
    };
    ui.supportsFullscreen = function () {
      var d = document;
      return !!(d.exitFullscreen || d.mozCancelFullScreen || d.webkitExitFullscreen || d.msExitFullscreen);
    };
    ui.getFullscreenAPI = function () {
      var dE = document.documentElement,
        api,
        tF = 'fullscreenchange';
      if (dE.requestFullscreen) {
        api = {
          enterK: 'requestFullscreen',
          exitK: 'exitFullscreen',
          elementK: 'fullscreenElement',
          eventK: tF
        };
      } else if (dE.mozRequestFullScreen) {
        api = {
          enterK: 'mozRequestFullScreen',
          exitK: 'mozCancelFullScreen',
          elementK: 'mozFullScreenElement',
          eventK: 'moz' + tF
        };
      } else if (dE.webkitRequestFullscreen) {
        api = {
          enterK: 'webkitRequestFullscreen',
          exitK: 'webkitExitFullscreen',
          elementK: 'webkitFullscreenElement',
          eventK: 'webkit' + tF
        };
      } else if (dE.msRequestFullscreen) {
        api = {
          enterK: 'msRequestFullscreen',
          exitK: 'msExitFullscreen',
          elementK: 'msFullscreenElement',
          eventK: 'MSFullscreenChange'
        };
      }
      if (api) {
        api.enter = function () {
          // disable close-on-scroll in fullscreen
          _initalCloseOnScrollValue = _options.closeOnScroll;
          _options.closeOnScroll = false;
          if (this.enterK === 'webkitRequestFullscreen') {
            pswp.template[this.enterK](Element.ALLOW_KEYBOARD_INPUT);
          } else {
            return pswp.template[this.enterK]();
          }
        };
        api.exit = function () {
          _options.closeOnScroll = _initalCloseOnScrollValue;
          return document[this.exitK]();
        };
        api.isFullscreen = function () {
          return document[this.elementK];
        };
      }
      return api;
    };
  };
  return PhotoSwipeUI_Default;
});

},{}],3:[function(require,module,exports){
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/*! PhotoSwipe - v4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
    module.exports = factory();
  } else {
    root.PhotoSwipe = factory();
  }
})(void 0, function () {
  'use strict';

  var PhotoSwipe = function PhotoSwipe(template, UiClass, items, options) {
    /*>>framework-bridge*/
    /**
     *
     * Set of generic functions used by gallery.
     * 
     * You're free to modify anything here as long as functionality is kept.
     * 
     */
    var framework = {
      features: null,
      bind: function bind(target, type, listener, unbind) {
        var methodName = (unbind ? 'remove' : 'add') + 'EventListener';
        type = type.split(' ');
        for (var i = 0; i < type.length; i++) {
          if (type[i]) {
            target[methodName](type[i], listener, false);
          }
        }
      },
      isArray: function isArray(obj) {
        return obj instanceof Array;
      },
      createEl: function createEl(classes, tag) {
        var el = document.createElement(tag || 'div');
        if (classes) {
          el.className = classes;
        }
        return el;
      },
      getScrollY: function getScrollY() {
        var yOffset = window.pageYOffset;
        return yOffset !== undefined ? yOffset : document.documentElement.scrollTop;
      },
      unbind: function unbind(target, type, listener) {
        framework.bind(target, type, listener, true);
      },
      removeClass: function removeClass(el, className) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
        el.className = el.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      },
      addClass: function addClass(el, className) {
        if (!framework.hasClass(el, className)) {
          el.className += (el.className ? ' ' : '') + className;
        }
      },
      hasClass: function hasClass(el, className) {
        return el.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(el.className);
      },
      getChildByClass: function getChildByClass(parentEl, childClassName) {
        var node = parentEl.firstChild;
        while (node) {
          if (framework.hasClass(node, childClassName)) {
            return node;
          }
          node = node.nextSibling;
        }
      },
      arraySearch: function arraySearch(array, value, key) {
        var i = array.length;
        while (i--) {
          if (array[i][key] === value) {
            return i;
          }
        }
        return -1;
      },
      extend: function extend(o1, o2, preventOverwrite) {
        for (var prop in o2) {
          if (o2.hasOwnProperty(prop)) {
            if (preventOverwrite && o1.hasOwnProperty(prop)) {
              continue;
            }
            o1[prop] = o2[prop];
          }
        }
      },
      easing: {
        sine: {
          out: function out(k) {
            return Math.sin(k * (Math.PI / 2));
          },
          inOut: function inOut(k) {
            return -(Math.cos(Math.PI * k) - 1) / 2;
          }
        },
        cubic: {
          out: function out(k) {
            return --k * k * k + 1;
          }
        }
        /*
        	elastic: {
        		out: function ( k ) {
        					var s, a = 0.1, p = 0.4;
        			if ( k === 0 ) return 0;
        			if ( k === 1 ) return 1;
        			if ( !a || a < 1 ) { a = 1; s = p / 4; }
        			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
        			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
        				},
        	},
        	back: {
        		out: function ( k ) {
        			var s = 1.70158;
        			return --k * k * ( ( s + 1 ) * k + s ) + 1;
        		}
        	}
        */
      },
      /**
       * 
       * @return {object}
       * 
       * {
       *  raf : request animation frame function
       *  caf : cancel animation frame function
       *  transfrom : transform property key (with vendor), or null if not supported
       *  oldIE : IE8 or below
       * }
       * 
       */
      detectFeatures: function detectFeatures() {
        if (framework.features) {
          return framework.features;
        }
        var helperEl = framework.createEl(),
          helperStyle = helperEl.style,
          vendor = '',
          features = {};

        // IE8 and below
        features.oldIE = document.all && !document.addEventListener;
        features.touch = 'ontouchstart' in window;
        if (window.requestAnimationFrame) {
          features.raf = window.requestAnimationFrame;
          features.caf = window.cancelAnimationFrame;
        }
        features.pointerEvent = navigator.pointerEnabled || navigator.msPointerEnabled;

        // fix false-positive detection of old Android in new IE
        // (IE11 ua string contains "Android 4.0")

        if (!features.pointerEvent) {
          var ua = navigator.userAgent;

          // Detect if device is iPhone or iPod and if it's older than iOS 8
          // http://stackoverflow.com/a/14223920
          // 
          // This detection is made because of buggy top/bottom toolbars
          // that don't trigger window.resize event.
          // For more info refer to _isFixedPosition variable in core.js

          if (/iP(hone|od)/.test(navigator.platform)) {
            var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v && v.length > 0) {
              v = parseInt(v[1], 10);
              if (v >= 1 && v < 8) {
                features.isOldIOSPhone = true;
              }
            }
          }

          // Detect old Android (before KitKat)
          // due to bugs related to position:fixed
          // http://stackoverflow.com/questions/7184573/pick-up-the-android-version-in-the-browser-by-javascript

          var match = ua.match(/Android\s([0-9\.]*)/);
          var androidversion = match ? match[1] : 0;
          androidversion = parseFloat(androidversion);
          if (androidversion >= 1) {
            if (androidversion < 4.4) {
              features.isOldAndroid = true; // for fixed position bug & performance
            }
            features.androidVersion = androidversion; // for touchend bug
          }
          features.isMobileOpera = /opera mini|opera mobi/i.test(ua);

          // p.s. yes, yes, UA sniffing is bad, propose your solution for above bugs.
        }
        var styleChecks = ['transform', 'perspective', 'animationName'],
          vendors = ['', 'webkit', 'Moz', 'ms', 'O'],
          styleCheckItem,
          styleName;
        for (var i = 0; i < 4; i++) {
          vendor = vendors[i];
          for (var a = 0; a < 3; a++) {
            styleCheckItem = styleChecks[a];

            // uppercase first letter of property name, if vendor is present
            styleName = vendor + (vendor ? styleCheckItem.charAt(0).toUpperCase() + styleCheckItem.slice(1) : styleCheckItem);
            if (!features[styleCheckItem] && styleName in helperStyle) {
              features[styleCheckItem] = styleName;
            }
          }
          if (vendor && !features.raf) {
            vendor = vendor.toLowerCase();
            features.raf = window[vendor + 'RequestAnimationFrame'];
            if (features.raf) {
              features.caf = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
            }
          }
        }
        if (!features.raf) {
          var lastTime = 0;
          features.raf = function (fn) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
              fn(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
          };
          features.caf = function (id) {
            clearTimeout(id);
          };
        }

        // Detect SVG support
        features.svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
        framework.features = features;
        return features;
      }
    };
    framework.detectFeatures();

    // Override addEventListener for old versions of IE
    if (framework.features.oldIE) {
      framework.bind = function (target, type, listener, unbind) {
        type = type.split(' ');
        var methodName = (unbind ? 'detach' : 'attach') + 'Event',
          evName,
          _handleEv = function _handleEv() {
            listener.handleEvent.call(listener);
          };
        for (var i = 0; i < type.length; i++) {
          evName = type[i];
          if (evName) {
            if (_typeof(listener) === 'object' && listener.handleEvent) {
              if (!unbind) {
                listener['oldIE' + evName] = _handleEv;
              } else {
                if (!listener['oldIE' + evName]) {
                  return false;
                }
              }
              target[methodName]('on' + evName, listener['oldIE' + evName]);
            } else {
              target[methodName]('on' + evName, listener);
            }
          }
        }
      };
    }

    /*>>framework-bridge*/

    /*>>core*/
    //function(template, UiClass, items, options)

    var self = this;

    /**
     * Static vars, don't change unless you know what you're doing.
     */
    var DOUBLE_TAP_RADIUS = 25,
      NUM_HOLDERS = 3;

    /**
     * Options
     */
    var _options = {
      allowPanToNext: true,
      spacing: 0.12,
      bgOpacity: 1,
      mouseUsed: false,
      loop: true,
      pinchToClose: true,
      closeOnScroll: true,
      closeOnVerticalDrag: true,
      verticalDragRange: 0.75,
      hideAnimationDuration: 333,
      showAnimationDuration: 333,
      showHideOpacity: false,
      focus: true,
      escKey: true,
      arrowKeys: true,
      mainScrollEndFriction: 0.35,
      panEndFriction: 0.35,
      isClickableElement: function isClickableElement(el) {
        return el.tagName === 'A';
      },
      getDoubleTapZoom: function getDoubleTapZoom(isMouseClick, item) {
        if (isMouseClick) {
          return 1;
        } else {
          return item.initialZoomLevel < 0.7 ? 1 : 1.33;
        }
      },
      maxSpreadZoom: 1.33,
      modal: true,
      // not fully implemented yet
      scaleMode: 'fit' // TODO
    };
    framework.extend(_options, options);

    /**
     * Private helper variables & functions
     */

    var _getEmptyPoint = function _getEmptyPoint() {
      return {
        x: 0,
        y: 0
      };
    };
    var _isOpen,
      _isDestroying,
      _closedByScroll,
      _currentItemIndex,
      _containerStyle,
      _containerShiftIndex,
      _currPanDist = _getEmptyPoint(),
      _startPanOffset = _getEmptyPoint(),
      _panOffset = _getEmptyPoint(),
      _upMoveEvents,
      // drag move, drag end & drag cancel events array
      _downEvents,
      // drag start events array
      _globalEventHandlers,
      _viewportSize = {},
      _currZoomLevel,
      _startZoomLevel,
      _translatePrefix,
      _translateSufix,
      _updateSizeInterval,
      _itemsNeedUpdate,
      _currPositionIndex = 0,
      _offset = {},
      _slideSize = _getEmptyPoint(),
      // size of slide area, including spacing
      _itemHolders,
      _prevItemIndex,
      _indexDiff = 0,
      // difference of indexes since last content update
      _dragStartEvent,
      _dragMoveEvent,
      _dragEndEvent,
      _dragCancelEvent,
      _transformKey,
      _pointerEventEnabled,
      _isFixedPosition = true,
      _likelyTouchDevice,
      _modules = [],
      _requestAF,
      _cancelAF,
      _initalClassName,
      _initalWindowScrollY,
      _oldIE,
      _currentWindowScrollY,
      _features,
      _windowVisibleSize = {},
      _renderMaxResolution = false,
      // Registers PhotoSWipe module (History, Controller ...)
      _registerModule = function _registerModule(name, module) {
        framework.extend(self, module.publicMethods);
        _modules.push(name);
      },
      _getLoopedId = function _getLoopedId(index) {
        var numSlides = _getNumItems();
        if (index > numSlides - 1) {
          return index - numSlides;
        } else if (index < 0) {
          return numSlides + index;
        }
        return index;
      },
      // Micro bind/trigger
      _listeners = {},
      _listen = function _listen(name, fn) {
        if (!_listeners[name]) {
          _listeners[name] = [];
        }
        return _listeners[name].push(fn);
      },
      _shout = function _shout(name) {
        var listeners = _listeners[name];
        if (listeners) {
          var args = Array.prototype.slice.call(arguments);
          args.shift();
          for (var i = 0; i < listeners.length; i++) {
            listeners[i].apply(self, args);
          }
        }
      },
      _getCurrentTime = function _getCurrentTime() {
        return new Date().getTime();
      },
      _applyBgOpacity = function _applyBgOpacity(opacity) {
        _bgOpacity = opacity;
        self.bg.style.opacity = opacity * _options.bgOpacity;
      },
      _applyZoomTransform = function _applyZoomTransform(styleObj, x, y, zoom, item) {
        if (!_renderMaxResolution || item && item !== self.currItem) {
          zoom = zoom / (item ? item.fitRatio : self.currItem.fitRatio);
        }
        styleObj[_transformKey] = _translatePrefix + x + 'px, ' + y + 'px' + _translateSufix + ' scale(' + zoom + ')';
      },
      _applyCurrentZoomPan = function _applyCurrentZoomPan(allowRenderResolution) {
        if (_currZoomElementStyle) {
          if (allowRenderResolution) {
            if (_currZoomLevel > self.currItem.fitRatio) {
              if (!_renderMaxResolution) {
                _setImageSize(self.currItem, false, true);
                _renderMaxResolution = true;
              }
            } else {
              if (_renderMaxResolution) {
                _setImageSize(self.currItem);
                _renderMaxResolution = false;
              }
            }
          }
          _applyZoomTransform(_currZoomElementStyle, _panOffset.x, _panOffset.y, _currZoomLevel);
        }
      },
      _applyZoomPanToItem = function _applyZoomPanToItem(item) {
        if (item.container) {
          _applyZoomTransform(item.container.style, item.initialPosition.x, item.initialPosition.y, item.initialZoomLevel, item);
        }
      },
      _setTranslateX = function _setTranslateX(x, elStyle) {
        elStyle[_transformKey] = _translatePrefix + x + 'px, 0px' + _translateSufix;
      },
      _moveMainScroll = function _moveMainScroll(x, dragging) {
        if (!_options.loop && dragging) {
          var newSlideIndexOffset = _currentItemIndex + (_slideSize.x * _currPositionIndex - x) / _slideSize.x,
            delta = Math.round(x - _mainScrollPos.x);
          if (newSlideIndexOffset < 0 && delta > 0 || newSlideIndexOffset >= _getNumItems() - 1 && delta < 0) {
            x = _mainScrollPos.x + delta * _options.mainScrollEndFriction;
          }
        }
        _mainScrollPos.x = x;
        _setTranslateX(x, _containerStyle);
      },
      _calculatePanOffset = function _calculatePanOffset(axis, zoomLevel) {
        var m = _midZoomPoint[axis] - _offset[axis];
        return _startPanOffset[axis] + _currPanDist[axis] + m - m * (zoomLevel / _startZoomLevel);
      },
      _equalizePoints = function _equalizePoints(p1, p2) {
        p1.x = p2.x;
        p1.y = p2.y;
        if (p2.id) {
          p1.id = p2.id;
        }
      },
      _roundPoint = function _roundPoint(p) {
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
      },
      _mouseMoveTimeout = null,
      _onFirstMouseMove2 = function _onFirstMouseMove() {
        // Wait until mouse move event is fired at least twice during 100ms
        // We do this, because some mobile browsers trigger it on touchstart
        if (_mouseMoveTimeout) {
          framework.unbind(document, 'mousemove', _onFirstMouseMove2);
          framework.addClass(template, 'pswp--has_mouse');
          _options.mouseUsed = true;
          _shout('mouseUsed');
        }
        _mouseMoveTimeout = setTimeout(function () {
          _mouseMoveTimeout = null;
        }, 100);
      },
      _bindEvents = function _bindEvents() {
        framework.bind(document, 'keydown', self);
        if (_features.transform) {
          // don't bind click event in browsers that don't support transform (mostly IE8)
          framework.bind(self.scrollWrap, 'click', self);
        }
        if (!_options.mouseUsed) {
          framework.bind(document, 'mousemove', _onFirstMouseMove2);
        }
        framework.bind(window, 'resize scroll', self);
        _shout('bindEvents');
      },
      _unbindEvents = function _unbindEvents() {
        framework.unbind(window, 'resize', self);
        framework.unbind(window, 'scroll', _globalEventHandlers.scroll);
        framework.unbind(document, 'keydown', self);
        framework.unbind(document, 'mousemove', _onFirstMouseMove2);
        if (_features.transform) {
          framework.unbind(self.scrollWrap, 'click', self);
        }
        if (_isDragging) {
          framework.unbind(window, _upMoveEvents, self);
        }
        _shout('unbindEvents');
      },
      _calculatePanBounds = function _calculatePanBounds(zoomLevel, update) {
        var bounds = _calculateItemSize(self.currItem, _viewportSize, zoomLevel);
        if (update) {
          _currPanBounds = bounds;
        }
        return bounds;
      },
      _getMinZoomLevel = function _getMinZoomLevel(item) {
        if (!item) {
          item = self.currItem;
        }
        return item.initialZoomLevel;
      },
      _getMaxZoomLevel = function _getMaxZoomLevel(item) {
        if (!item) {
          item = self.currItem;
        }
        return item.w > 0 ? _options.maxSpreadZoom : 1;
      },
      // Return true if offset is out of the bounds
      _modifyDestPanOffset = function _modifyDestPanOffset(axis, destPanBounds, destPanOffset, destZoomLevel) {
        if (destZoomLevel === self.currItem.initialZoomLevel) {
          destPanOffset[axis] = self.currItem.initialPosition[axis];
          return true;
        } else {
          destPanOffset[axis] = _calculatePanOffset(axis, destZoomLevel);
          if (destPanOffset[axis] > destPanBounds.min[axis]) {
            destPanOffset[axis] = destPanBounds.min[axis];
            return true;
          } else if (destPanOffset[axis] < destPanBounds.max[axis]) {
            destPanOffset[axis] = destPanBounds.max[axis];
            return true;
          }
        }
        return false;
      },
      _setupTransforms = function _setupTransforms() {
        if (_transformKey) {
          // setup 3d transforms
          var allow3dTransform = _features.perspective && !_likelyTouchDevice;
          _translatePrefix = 'translate' + (allow3dTransform ? '3d(' : '(');
          _translateSufix = _features.perspective ? ', 0px)' : ')';
          return;
        }

        // Override zoom/pan/move functions in case old browser is used (most likely IE)
        // (so they use left/top/width/height, instead of CSS transform)

        _transformKey = 'left';
        framework.addClass(template, 'pswp--ie');
        _setTranslateX = function _setTranslateX(x, elStyle) {
          elStyle.left = x + 'px';
        };
        _applyZoomPanToItem = function _applyZoomPanToItem(item) {
          var zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
            s = item.container.style,
            w = zoomRatio * item.w,
            h = zoomRatio * item.h;
          s.width = w + 'px';
          s.height = h + 'px';
          s.left = item.initialPosition.x + 'px';
          s.top = item.initialPosition.y + 'px';
        };
        _applyCurrentZoomPan = function _applyCurrentZoomPan() {
          if (_currZoomElementStyle) {
            var s = _currZoomElementStyle,
              item = self.currItem,
              zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
              w = zoomRatio * item.w,
              h = zoomRatio * item.h;
            s.width = w + 'px';
            s.height = h + 'px';
            s.left = _panOffset.x + 'px';
            s.top = _panOffset.y + 'px';
          }
        };
      },
      _onKeyDown = function _onKeyDown(e) {
        var keydownAction = '';
        if (_options.escKey && e.keyCode === 27) {
          keydownAction = 'close';
        } else if (_options.arrowKeys) {
          if (e.keyCode === 37) {
            keydownAction = 'prev';
          } else if (e.keyCode === 39) {
            keydownAction = 'next';
          }
        }
        if (keydownAction) {
          // don't do anything if special key pressed to prevent from overriding default browser actions
          // e.g. in Chrome on Mac cmd+arrow-left returns to previous page
          if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
            if (e.preventDefault) {
              e.preventDefault();
            } else {
              e.returnValue = false;
            }
            self[keydownAction]();
          }
        }
      },
      _onGlobalClick = function _onGlobalClick(e) {
        if (!e) {
          return;
        }

        // don't allow click event to pass through when triggering after drag or some other gesture
        if (_moved || _zoomStarted || _mainScrollAnimating || _verticalDragInitiated) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      _updatePageScrollOffset = function _updatePageScrollOffset() {
        self.setScrollOffset(0, framework.getScrollY());
      };

    // Micro animation engine
    var _animations = {},
      _numAnimations = 0,
      _stopAnimation = function _stopAnimation(name) {
        if (_animations[name]) {
          if (_animations[name].raf) {
            _cancelAF(_animations[name].raf);
          }
          _numAnimations--;
          delete _animations[name];
        }
      },
      _registerStartAnimation = function _registerStartAnimation(name) {
        if (_animations[name]) {
          _stopAnimation(name);
        }
        if (!_animations[name]) {
          _numAnimations++;
          _animations[name] = {};
        }
      },
      _stopAllAnimations = function _stopAllAnimations() {
        for (var prop in _animations) {
          if (_animations.hasOwnProperty(prop)) {
            _stopAnimation(prop);
          }
        }
      },
      _animateProp = function _animateProp(name, b, endProp, d, easingFn, onUpdate, onComplete) {
        var startAnimTime = _getCurrentTime(),
          t;
        _registerStartAnimation(name);
        var _animloop = function animloop() {
          if (_animations[name]) {
            t = _getCurrentTime() - startAnimTime; // time diff
            //b - beginning (start prop)
            //d - anim duration

            if (t >= d) {
              _stopAnimation(name);
              onUpdate(endProp);
              if (onComplete) {
                onComplete();
              }
              return;
            }
            onUpdate((endProp - b) * easingFn(t / d) + b);
            _animations[name].raf = _requestAF(_animloop);
          }
        };
        _animloop();
      };
    var publicMethods = {
      // make a few local variables and functions public
      shout: _shout,
      listen: _listen,
      viewportSize: _viewportSize,
      options: _options,
      isMainScrollAnimating: function isMainScrollAnimating() {
        return _mainScrollAnimating;
      },
      getZoomLevel: function getZoomLevel() {
        return _currZoomLevel;
      },
      getCurrentIndex: function getCurrentIndex() {
        return _currentItemIndex;
      },
      isDragging: function isDragging() {
        return _isDragging;
      },
      isZooming: function isZooming() {
        return _isZooming;
      },
      setScrollOffset: function setScrollOffset(x, y) {
        _offset.x = x;
        _currentWindowScrollY = _offset.y = y;
        _shout('updateScrollOffset', _offset);
      },
      applyZoomPan: function applyZoomPan(zoomLevel, panX, panY, allowRenderResolution) {
        _panOffset.x = panX;
        _panOffset.y = panY;
        _currZoomLevel = zoomLevel;
        _applyCurrentZoomPan(allowRenderResolution);
      },
      init: function init() {
        if (_isOpen || _isDestroying) {
          return;
        }
        var i;
        self.framework = framework; // basic functionality
        self.template = template; // root DOM element of PhotoSwipe
        self.bg = framework.getChildByClass(template, 'pswp__bg');
        _initalClassName = template.className;
        _isOpen = true;
        _features = framework.detectFeatures();
        _requestAF = _features.raf;
        _cancelAF = _features.caf;
        _transformKey = _features.transform;
        _oldIE = _features.oldIE;
        self.scrollWrap = framework.getChildByClass(template, 'pswp__scroll-wrap');
        self.container = framework.getChildByClass(self.scrollWrap, 'pswp__container');
        _containerStyle = self.container.style; // for fast access

        // Objects that hold slides (there are only 3 in DOM)
        self.itemHolders = _itemHolders = [{
          el: self.container.children[0],
          wrap: 0,
          index: -1
        }, {
          el: self.container.children[1],
          wrap: 0,
          index: -1
        }, {
          el: self.container.children[2],
          wrap: 0,
          index: -1
        }];

        // hide nearby item holders until initial zoom animation finishes (to avoid extra Paints)
        _itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'none';
        _setupTransforms();

        // Setup global events
        _globalEventHandlers = {
          resize: self.updateSize,
          scroll: _updatePageScrollOffset,
          keydown: _onKeyDown,
          click: _onGlobalClick
        };

        // disable show/hide effects on old browsers that don't support CSS animations or transforms, 
        // old IOS, Android and Opera mobile. Blackberry seems to work fine, even older models.
        var oldPhone = _features.isOldIOSPhone || _features.isOldAndroid || _features.isMobileOpera;
        if (!_features.animationName || !_features.transform || oldPhone) {
          _options.showAnimationDuration = _options.hideAnimationDuration = 0;
        }

        // init modules
        for (i = 0; i < _modules.length; i++) {
          self['init' + _modules[i]]();
        }

        // init
        if (UiClass) {
          var ui = self.ui = new UiClass(self, framework);
          ui.init();
        }
        _shout('firstUpdate');
        _currentItemIndex = _currentItemIndex || _options.index || 0;
        // validate index
        if (isNaN(_currentItemIndex) || _currentItemIndex < 0 || _currentItemIndex >= _getNumItems()) {
          _currentItemIndex = 0;
        }
        self.currItem = _getItemAt(_currentItemIndex);
        if (_features.isOldIOSPhone || _features.isOldAndroid) {
          _isFixedPosition = false;
        }
        template.setAttribute('aria-hidden', 'false');
        if (_options.modal) {
          if (!_isFixedPosition) {
            template.style.position = 'absolute';
            template.style.top = framework.getScrollY() + 'px';
          } else {
            template.style.position = 'fixed';
          }
        }
        if (_currentWindowScrollY === undefined) {
          _shout('initialLayout');
          _currentWindowScrollY = _initalWindowScrollY = framework.getScrollY();
        }

        // add classes to root element of PhotoSwipe
        var rootClasses = 'pswp--open ';
        if (_options.mainClass) {
          rootClasses += _options.mainClass + ' ';
        }
        if (_options.showHideOpacity) {
          rootClasses += 'pswp--animate_opacity ';
        }
        rootClasses += _likelyTouchDevice ? 'pswp--touch' : 'pswp--notouch';
        rootClasses += _features.animationName ? ' pswp--css_animation' : '';
        rootClasses += _features.svg ? ' pswp--svg' : '';
        framework.addClass(template, rootClasses);
        self.updateSize();

        // initial update
        _containerShiftIndex = -1;
        _indexDiff = null;
        for (i = 0; i < NUM_HOLDERS; i++) {
          _setTranslateX((i + _containerShiftIndex) * _slideSize.x, _itemHolders[i].el.style);
        }
        if (!_oldIE) {
          framework.bind(self.scrollWrap, _downEvents, self); // no dragging for old IE
        }
        _listen('initialZoomInEnd', function () {
          self.setContent(_itemHolders[0], _currentItemIndex - 1);
          self.setContent(_itemHolders[2], _currentItemIndex + 1);
          _itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'block';
          if (_options.focus) {
            // focus causes layout, 
            // which causes lag during the animation, 
            // that's why we delay it untill the initial zoom transition ends
            template.focus();
          }
          _bindEvents();
        });

        // set content for center slide (first time)
        self.setContent(_itemHolders[1], _currentItemIndex);
        self.updateCurrItem();
        _shout('afterInit');
        if (!_isFixedPosition) {
          // On all versions of iOS lower than 8.0, we check size of viewport every second.
          // 
          // This is done to detect when Safari top & bottom bars appear, 
          // as this action doesn't trigger any events (like resize). 
          // 
          // On iOS8 they fixed this.
          // 
          // 10 Nov 2014: iOS 7 usage ~40%. iOS 8 usage 56%.

          _updateSizeInterval = setInterval(function () {
            if (!_numAnimations && !_isDragging && !_isZooming && _currZoomLevel === self.currItem.initialZoomLevel) {
              self.updateSize();
            }
          }, 1000);
        }
        framework.addClass(template, 'pswp--visible');
      },
      // Close the gallery, then destroy it
      close: function close() {
        if (!_isOpen) {
          return;
        }
        _isOpen = false;
        _isDestroying = true;
        _shout('close');
        _unbindEvents();
        _showOrHide(self.currItem, null, true, self.destroy);
      },
      // destroys the gallery (unbinds events, cleans up intervals and timeouts to avoid memory leaks)
      destroy: function destroy() {
        _shout('destroy');
        if (_showOrHideTimeout) {
          clearTimeout(_showOrHideTimeout);
        }
        template.setAttribute('aria-hidden', 'true');
        template.className = _initalClassName;
        if (_updateSizeInterval) {
          clearInterval(_updateSizeInterval);
        }
        framework.unbind(self.scrollWrap, _downEvents, self);

        // we unbind scroll event at the end, as closing animation may depend on it
        framework.unbind(window, 'scroll', self);
        _stopDragUpdateLoop();
        _stopAllAnimations();
        _listeners = null;
      },
      /**
       * Pan image to position
       * @param {Number} x     
       * @param {Number} y     
       * @param {Boolean} force Will ignore bounds if set to true.
       */
      panTo: function panTo(x, y, force) {
        if (!force) {
          if (x > _currPanBounds.min.x) {
            x = _currPanBounds.min.x;
          } else if (x < _currPanBounds.max.x) {
            x = _currPanBounds.max.x;
          }
          if (y > _currPanBounds.min.y) {
            y = _currPanBounds.min.y;
          } else if (y < _currPanBounds.max.y) {
            y = _currPanBounds.max.y;
          }
        }
        _panOffset.x = x;
        _panOffset.y = y;
        _applyCurrentZoomPan();
      },
      handleEvent: function handleEvent(e) {
        e = e || window.event;
        if (_globalEventHandlers[e.type]) {
          _globalEventHandlers[e.type](e);
        }
      },
      goTo: function goTo(index) {
        index = _getLoopedId(index);
        var diff = index - _currentItemIndex;
        _indexDiff = diff;
        _currentItemIndex = index;
        self.currItem = _getItemAt(_currentItemIndex);
        _currPositionIndex -= diff;
        _moveMainScroll(_slideSize.x * _currPositionIndex);
        _stopAllAnimations();
        _mainScrollAnimating = false;
        self.updateCurrItem();
      },
      next: function next() {
        self.goTo(_currentItemIndex + 1);
      },
      prev: function prev() {
        self.goTo(_currentItemIndex - 1);
      },
      // update current zoom/pan objects
      updateCurrZoomItem: function updateCurrZoomItem(emulateSetContent) {
        if (emulateSetContent) {
          _shout('beforeChange', 0);
        }

        // itemHolder[1] is middle (current) item
        if (_itemHolders[1].el.children.length) {
          var zoomElement = _itemHolders[1].el.children[0];
          if (framework.hasClass(zoomElement, 'pswp__zoom-wrap')) {
            _currZoomElementStyle = zoomElement.style;
          } else {
            _currZoomElementStyle = null;
          }
        } else {
          _currZoomElementStyle = null;
        }
        _currPanBounds = self.currItem.bounds;
        _startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;
        _panOffset.x = _currPanBounds.center.x;
        _panOffset.y = _currPanBounds.center.y;
        if (emulateSetContent) {
          _shout('afterChange');
        }
      },
      invalidateCurrItems: function invalidateCurrItems() {
        _itemsNeedUpdate = true;
        for (var i = 0; i < NUM_HOLDERS; i++) {
          if (_itemHolders[i].item) {
            _itemHolders[i].item.needsUpdate = true;
          }
        }
      },
      updateCurrItem: function updateCurrItem(beforeAnimation) {
        if (_indexDiff === 0) {
          return;
        }
        var diffAbs = Math.abs(_indexDiff),
          tempHolder;
        if (beforeAnimation && diffAbs < 2) {
          return;
        }
        self.currItem = _getItemAt(_currentItemIndex);
        _renderMaxResolution = false;
        _shout('beforeChange', _indexDiff);
        if (diffAbs >= NUM_HOLDERS) {
          _containerShiftIndex += _indexDiff + (_indexDiff > 0 ? -NUM_HOLDERS : NUM_HOLDERS);
          diffAbs = NUM_HOLDERS;
        }
        for (var i = 0; i < diffAbs; i++) {
          if (_indexDiff > 0) {
            tempHolder = _itemHolders.shift();
            _itemHolders[NUM_HOLDERS - 1] = tempHolder; // move first to last

            _containerShiftIndex++;
            _setTranslateX((_containerShiftIndex + 2) * _slideSize.x, tempHolder.el.style);
            self.setContent(tempHolder, _currentItemIndex - diffAbs + i + 1 + 1);
          } else {
            tempHolder = _itemHolders.pop();
            _itemHolders.unshift(tempHolder); // move last to first

            _containerShiftIndex--;
            _setTranslateX(_containerShiftIndex * _slideSize.x, tempHolder.el.style);
            self.setContent(tempHolder, _currentItemIndex + diffAbs - i - 1 - 1);
          }
        }

        // reset zoom/pan on previous item
        if (_currZoomElementStyle && Math.abs(_indexDiff) === 1) {
          var prevItem = _getItemAt(_prevItemIndex);
          if (prevItem.initialZoomLevel !== _currZoomLevel) {
            _calculateItemSize(prevItem, _viewportSize);
            _setImageSize(prevItem);
            _applyZoomPanToItem(prevItem);
          }
        }

        // reset diff after update
        _indexDiff = 0;
        self.updateCurrZoomItem();
        _prevItemIndex = _currentItemIndex;
        _shout('afterChange');
      },
      updateSize: function updateSize(force) {
        if (!_isFixedPosition && _options.modal) {
          var windowScrollY = framework.getScrollY();
          if (_currentWindowScrollY !== windowScrollY) {
            template.style.top = windowScrollY + 'px';
            _currentWindowScrollY = windowScrollY;
          }
          if (!force && _windowVisibleSize.x === window.innerWidth && _windowVisibleSize.y === window.innerHeight) {
            return;
          }
          _windowVisibleSize.x = window.innerWidth;
          _windowVisibleSize.y = window.innerHeight;

          //template.style.width = _windowVisibleSize.x + 'px';
          template.style.height = _windowVisibleSize.y + 'px';
        }
        _viewportSize.x = self.scrollWrap.clientWidth;
        _viewportSize.y = self.scrollWrap.clientHeight;
        _updatePageScrollOffset();
        _slideSize.x = _viewportSize.x + Math.round(_viewportSize.x * _options.spacing);
        _slideSize.y = _viewportSize.y;
        _moveMainScroll(_slideSize.x * _currPositionIndex);
        _shout('beforeResize'); // even may be used for example to switch image sources

        // don't re-calculate size on inital size update
        if (_containerShiftIndex !== undefined) {
          var holder, item, hIndex;
          for (var i = 0; i < NUM_HOLDERS; i++) {
            holder = _itemHolders[i];
            _setTranslateX((i + _containerShiftIndex) * _slideSize.x, holder.el.style);
            hIndex = _currentItemIndex + i - 1;
            if (_options.loop && _getNumItems() > 2) {
              hIndex = _getLoopedId(hIndex);
            }

            // update zoom level on items and refresh source (if needsUpdate)
            item = _getItemAt(hIndex);

            // re-render gallery item if `needsUpdate`,
            // or doesn't have `bounds` (entirely new slide object)
            if (item && (_itemsNeedUpdate || item.needsUpdate || !item.bounds)) {
              self.cleanSlide(item);
              self.setContent(holder, hIndex);

              // if "center" slide
              if (i === 1) {
                self.currItem = item;
                self.updateCurrZoomItem(true);
              }
              item.needsUpdate = false;
            } else if (holder.index === -1 && hIndex >= 0) {
              // add content first time
              self.setContent(holder, hIndex);
            }
            if (item && item.container) {
              _calculateItemSize(item, _viewportSize);
              _setImageSize(item);
              _applyZoomPanToItem(item);
            }
          }
          _itemsNeedUpdate = false;
        }
        _startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;
        _currPanBounds = self.currItem.bounds;
        if (_currPanBounds) {
          _panOffset.x = _currPanBounds.center.x;
          _panOffset.y = _currPanBounds.center.y;
          _applyCurrentZoomPan(true);
        }
        _shout('resize');
      },
      // Zoom current item to
      zoomTo: function zoomTo(destZoomLevel, centerPoint, speed, easingFn, updateFn) {
        /*
        	if(destZoomLevel === 'fit') {
        		destZoomLevel = self.currItem.fitRatio;
        	} else if(destZoomLevel === 'fill') {
        		destZoomLevel = self.currItem.fillRatio;
        	}
        */

        if (centerPoint) {
          _startZoomLevel = _currZoomLevel;
          _midZoomPoint.x = Math.abs(centerPoint.x) - _panOffset.x;
          _midZoomPoint.y = Math.abs(centerPoint.y) - _panOffset.y;
          _equalizePoints(_startPanOffset, _panOffset);
        }
        var destPanBounds = _calculatePanBounds(destZoomLevel, false),
          destPanOffset = {};
        _modifyDestPanOffset('x', destPanBounds, destPanOffset, destZoomLevel);
        _modifyDestPanOffset('y', destPanBounds, destPanOffset, destZoomLevel);
        var initialZoomLevel = _currZoomLevel;
        var initialPanOffset = {
          x: _panOffset.x,
          y: _panOffset.y
        };
        _roundPoint(destPanOffset);
        var onUpdate = function onUpdate(now) {
          if (now === 1) {
            _currZoomLevel = destZoomLevel;
            _panOffset.x = destPanOffset.x;
            _panOffset.y = destPanOffset.y;
          } else {
            _currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
            _panOffset.x = (destPanOffset.x - initialPanOffset.x) * now + initialPanOffset.x;
            _panOffset.y = (destPanOffset.y - initialPanOffset.y) * now + initialPanOffset.y;
          }
          if (updateFn) {
            updateFn(now);
          }
          _applyCurrentZoomPan(now === 1);
        };
        if (speed) {
          _animateProp('customZoomTo', 0, 1, speed, easingFn || framework.easing.sine.inOut, onUpdate);
        } else {
          onUpdate(1);
        }
      }
    };

    /*>>core*/

    /*>>gestures*/
    /**
     * Mouse/touch/pointer event handlers.
     * 
     * separated from @core.js for readability
     */

    var MIN_SWIPE_DISTANCE = 30,
      DIRECTION_CHECK_OFFSET = 10; // amount of pixels to drag to determine direction of swipe

    var _gestureStartTime,
      _gestureCheckSpeedTime,
      // pool of objects that are used during dragging of zooming
      p = {},
      // first point
      p2 = {},
      // second point (for zoom gesture)
      delta = {},
      _currPoint = {},
      _startPoint = {},
      _currPointers = [],
      _startMainScrollPos = {},
      _releaseAnimData,
      _posPoints = [],
      // array of points during dragging, used to determine type of gesture
      _tempPoint = {},
      _isZoomingIn,
      _verticalDragInitiated,
      _oldAndroidTouchEndTimeout,
      _currZoomedItemIndex = 0,
      _centerPoint = _getEmptyPoint(),
      _lastReleaseTime = 0,
      _isDragging,
      // at least one pointer is down
      _isMultitouch,
      // at least two _pointers are down
      _zoomStarted,
      // zoom level changed during zoom gesture
      _moved,
      _dragAnimFrame,
      _mainScrollShifted,
      _currentPoints,
      // array of current touch points
      _isZooming,
      _currPointsDistance,
      _startPointsDistance,
      _currPanBounds,
      _mainScrollPos = _getEmptyPoint(),
      _currZoomElementStyle,
      _mainScrollAnimating,
      // true, if animation after swipe gesture is running
      _midZoomPoint = _getEmptyPoint(),
      _currCenterPoint = _getEmptyPoint(),
      _direction,
      _isFirstMove,
      _opacityChanged,
      _bgOpacity,
      _wasOverInitialZoom,
      _isEqualPoints = function _isEqualPoints(p1, p2) {
        return p1.x === p2.x && p1.y === p2.y;
      },
      _isNearbyPoints = function _isNearbyPoints(touch0, touch1) {
        return Math.abs(touch0.x - touch1.x) < DOUBLE_TAP_RADIUS && Math.abs(touch0.y - touch1.y) < DOUBLE_TAP_RADIUS;
      },
      _calculatePointsDistance = function _calculatePointsDistance(p1, p2) {
        _tempPoint.x = Math.abs(p1.x - p2.x);
        _tempPoint.y = Math.abs(p1.y - p2.y);
        return Math.sqrt(_tempPoint.x * _tempPoint.x + _tempPoint.y * _tempPoint.y);
      },
      _stopDragUpdateLoop = function _stopDragUpdateLoop() {
        if (_dragAnimFrame) {
          _cancelAF(_dragAnimFrame);
          _dragAnimFrame = null;
        }
      },
      _dragUpdateLoop2 = function _dragUpdateLoop() {
        if (_isDragging) {
          _dragAnimFrame = _requestAF(_dragUpdateLoop2);
          _renderMovement();
        }
      },
      _canPan = function _canPan() {
        return !(_options.scaleMode === 'fit' && _currZoomLevel === self.currItem.initialZoomLevel);
      },
      // find the closest parent DOM element
      _closestElement2 = function _closestElement(el, fn) {
        if (!el || el === document) {
          return false;
        }

        // don't search elements above pswp__scroll-wrap
        if (el.getAttribute('class') && el.getAttribute('class').indexOf('pswp__scroll-wrap') > -1) {
          return false;
        }
        if (fn(el)) {
          return el;
        }
        return _closestElement2(el.parentNode, fn);
      },
      _preventObj = {},
      _preventDefaultEventBehaviour = function _preventDefaultEventBehaviour(e, isDown) {
        _preventObj.prevent = !_closestElement2(e.target, _options.isClickableElement);
        _shout('preventDragEvent', e, isDown, _preventObj);
        return _preventObj.prevent;
      },
      _convertTouchToPoint = function _convertTouchToPoint(touch, p) {
        p.x = touch.pageX;
        p.y = touch.pageY;
        p.id = touch.identifier;
        return p;
      },
      _findCenterOfPoints = function _findCenterOfPoints(p1, p2, pCenter) {
        pCenter.x = (p1.x + p2.x) * 0.5;
        pCenter.y = (p1.y + p2.y) * 0.5;
      },
      _pushPosPoint = function _pushPosPoint(time, x, y) {
        if (time - _gestureCheckSpeedTime > 50) {
          var o = _posPoints.length > 2 ? _posPoints.shift() : {};
          o.x = x;
          o.y = y;
          _posPoints.push(o);
          _gestureCheckSpeedTime = time;
        }
      },
      _calculateVerticalDragOpacityRatio = function _calculateVerticalDragOpacityRatio() {
        var yOffset = _panOffset.y - self.currItem.initialPosition.y; // difference between initial and current position
        return 1 - Math.abs(yOffset / (_viewportSize.y / 2));
      },
      // points pool, reused during touch events
      _ePoint1 = {},
      _ePoint2 = {},
      _tempPointsArr = [],
      _tempCounter,
      _getTouchPoints = function _getTouchPoints(e) {
        // clean up previous points, without recreating array
        while (_tempPointsArr.length > 0) {
          _tempPointsArr.pop();
        }
        if (!_pointerEventEnabled) {
          if (e.type.indexOf('touch') > -1) {
            if (e.touches && e.touches.length > 0) {
              _tempPointsArr[0] = _convertTouchToPoint(e.touches[0], _ePoint1);
              if (e.touches.length > 1) {
                _tempPointsArr[1] = _convertTouchToPoint(e.touches[1], _ePoint2);
              }
            }
          } else {
            _ePoint1.x = e.pageX;
            _ePoint1.y = e.pageY;
            _ePoint1.id = '';
            _tempPointsArr[0] = _ePoint1; //_ePoint1;
          }
        } else {
          _tempCounter = 0;
          // we can use forEach, as pointer events are supported only in modern browsers
          _currPointers.forEach(function (p) {
            if (_tempCounter === 0) {
              _tempPointsArr[0] = p;
            } else if (_tempCounter === 1) {
              _tempPointsArr[1] = p;
            }
            _tempCounter++;
          });
        }
        return _tempPointsArr;
      },
      _panOrMoveMainScroll = function _panOrMoveMainScroll(axis, delta) {
        var panFriction,
          overDiff = 0,
          newOffset = _panOffset[axis] + delta[axis],
          startOverDiff,
          dir = delta[axis] > 0,
          newMainScrollPosition = _mainScrollPos.x + delta.x,
          mainScrollDiff = _mainScrollPos.x - _startMainScrollPos.x,
          newPanPos,
          newMainScrollPos;

        // calculate fdistance over the bounds and friction
        if (newOffset > _currPanBounds.min[axis] || newOffset < _currPanBounds.max[axis]) {
          panFriction = _options.panEndFriction;
          // Linear increasing of friction, so at 1/4 of viewport it's at max value. 
          // Looks not as nice as was expected. Left for history.
          // panFriction = (1 - (_panOffset[axis] + delta[axis] + panBounds.min[axis]) / (_viewportSize[axis] / 4) );
        } else {
          panFriction = 1;
        }
        newOffset = _panOffset[axis] + delta[axis] * panFriction;

        // move main scroll or start panning
        if (_options.allowPanToNext || _currZoomLevel === self.currItem.initialZoomLevel) {
          if (!_currZoomElementStyle) {
            newMainScrollPos = newMainScrollPosition;
          } else if (_direction === 'h' && axis === 'x' && !_zoomStarted) {
            if (dir) {
              if (newOffset > _currPanBounds.min[axis]) {
                panFriction = _options.panEndFriction;
                overDiff = _currPanBounds.min[axis] - newOffset;
                startOverDiff = _currPanBounds.min[axis] - _startPanOffset[axis];
              }

              // drag right
              if ((startOverDiff <= 0 || mainScrollDiff < 0) && _getNumItems() > 1) {
                newMainScrollPos = newMainScrollPosition;
                if (mainScrollDiff < 0 && newMainScrollPosition > _startMainScrollPos.x) {
                  newMainScrollPos = _startMainScrollPos.x;
                }
              } else {
                if (_currPanBounds.min.x !== _currPanBounds.max.x) {
                  newPanPos = newOffset;
                }
              }
            } else {
              if (newOffset < _currPanBounds.max[axis]) {
                panFriction = _options.panEndFriction;
                overDiff = newOffset - _currPanBounds.max[axis];
                startOverDiff = _startPanOffset[axis] - _currPanBounds.max[axis];
              }
              if ((startOverDiff <= 0 || mainScrollDiff > 0) && _getNumItems() > 1) {
                newMainScrollPos = newMainScrollPosition;
                if (mainScrollDiff > 0 && newMainScrollPosition < _startMainScrollPos.x) {
                  newMainScrollPos = _startMainScrollPos.x;
                }
              } else {
                if (_currPanBounds.min.x !== _currPanBounds.max.x) {
                  newPanPos = newOffset;
                }
              }
            }

            //
          }
          if (axis === 'x') {
            if (newMainScrollPos !== undefined) {
              _moveMainScroll(newMainScrollPos, true);
              if (newMainScrollPos === _startMainScrollPos.x) {
                _mainScrollShifted = false;
              } else {
                _mainScrollShifted = true;
              }
            }
            if (_currPanBounds.min.x !== _currPanBounds.max.x) {
              if (newPanPos !== undefined) {
                _panOffset.x = newPanPos;
              } else if (!_mainScrollShifted) {
                _panOffset.x += delta.x * panFriction;
              }
            }
            return newMainScrollPos !== undefined;
          }
        }
        if (!_mainScrollAnimating) {
          if (!_mainScrollShifted) {
            if (_currZoomLevel > self.currItem.fitRatio) {
              _panOffset[axis] += delta[axis] * panFriction;
            }
          }
        }
      },
      // Pointerdown/touchstart/mousedown handler
      _onDragStart = function _onDragStart(e) {
        // Allow dragging only via left mouse button.
        // As this handler is not added in IE8 - we ignore e.which
        // 
        // http://www.quirksmode.org/js/events_properties.html
        // https://developer.mozilla.org/en-US/docs/Web/API/event.button
        if (e.type === 'mousedown' && e.button > 0) {
          return;
        }
        if (_initialZoomRunning) {
          e.preventDefault();
          return;
        }
        if (_oldAndroidTouchEndTimeout && e.type === 'mousedown') {
          return;
        }
        if (_preventDefaultEventBehaviour(e, true)) {
          e.preventDefault();
        }
        _shout('pointerDown');
        if (_pointerEventEnabled) {
          var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
          if (pointerIndex < 0) {
            pointerIndex = _currPointers.length;
          }
          _currPointers[pointerIndex] = {
            x: e.pageX,
            y: e.pageY,
            id: e.pointerId
          };
        }
        var startPointsList = _getTouchPoints(e),
          numPoints = startPointsList.length;
        _currentPoints = null;
        _stopAllAnimations();

        // init drag
        if (!_isDragging || numPoints === 1) {
          _isDragging = _isFirstMove = true;
          framework.bind(window, _upMoveEvents, self);
          _isZoomingIn = _wasOverInitialZoom = _opacityChanged = _verticalDragInitiated = _mainScrollShifted = _moved = _isMultitouch = _zoomStarted = false;
          _direction = null;
          _shout('firstTouchStart', startPointsList);
          _equalizePoints(_startPanOffset, _panOffset);
          _currPanDist.x = _currPanDist.y = 0;
          _equalizePoints(_currPoint, startPointsList[0]);
          _equalizePoints(_startPoint, _currPoint);

          //_equalizePoints(_startMainScrollPos, _mainScrollPos);
          _startMainScrollPos.x = _slideSize.x * _currPositionIndex;
          _posPoints = [{
            x: _currPoint.x,
            y: _currPoint.y
          }];
          _gestureCheckSpeedTime = _gestureStartTime = _getCurrentTime();

          //_mainScrollAnimationEnd(true);
          _calculatePanBounds(_currZoomLevel, true);

          // Start rendering
          _stopDragUpdateLoop();
          _dragUpdateLoop2();
        }

        // init zoom
        if (!_isZooming && numPoints > 1 && !_mainScrollAnimating && !_mainScrollShifted) {
          _startZoomLevel = _currZoomLevel;
          _zoomStarted = false; // true if zoom changed at least once

          _isZooming = _isMultitouch = true;
          _currPanDist.y = _currPanDist.x = 0;
          _equalizePoints(_startPanOffset, _panOffset);
          _equalizePoints(p, startPointsList[0]);
          _equalizePoints(p2, startPointsList[1]);
          _findCenterOfPoints(p, p2, _currCenterPoint);
          _midZoomPoint.x = Math.abs(_currCenterPoint.x) - _panOffset.x;
          _midZoomPoint.y = Math.abs(_currCenterPoint.y) - _panOffset.y;
          _currPointsDistance = _startPointsDistance = _calculatePointsDistance(p, p2);
        }
      },
      // Pointermove/touchmove/mousemove handler
      _onDragMove = function _onDragMove(e) {
        e.preventDefault();
        if (_pointerEventEnabled) {
          var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
          if (pointerIndex > -1) {
            var p = _currPointers[pointerIndex];
            p.x = e.pageX;
            p.y = e.pageY;
          }
        }
        if (_isDragging) {
          var touchesList = _getTouchPoints(e);
          if (!_direction && !_moved && !_isZooming) {
            if (_mainScrollPos.x !== _slideSize.x * _currPositionIndex) {
              // if main scroll position is shifted – direction is always horizontal
              _direction = 'h';
            } else {
              var diff = Math.abs(touchesList[0].x - _currPoint.x) - Math.abs(touchesList[0].y - _currPoint.y);
              // check the direction of movement
              if (Math.abs(diff) >= DIRECTION_CHECK_OFFSET) {
                _direction = diff > 0 ? 'h' : 'v';
                _currentPoints = touchesList;
              }
            }
          } else {
            _currentPoints = touchesList;
          }
        }
      },
      // 
      _renderMovement = function _renderMovement() {
        if (!_currentPoints) {
          return;
        }
        var numPoints = _currentPoints.length;
        if (numPoints === 0) {
          return;
        }
        _equalizePoints(p, _currentPoints[0]);
        delta.x = p.x - _currPoint.x;
        delta.y = p.y - _currPoint.y;
        if (_isZooming && numPoints > 1) {
          // Handle behaviour for more than 1 point

          _currPoint.x = p.x;
          _currPoint.y = p.y;

          // check if one of two points changed
          if (!delta.x && !delta.y && _isEqualPoints(_currentPoints[1], p2)) {
            return;
          }
          _equalizePoints(p2, _currentPoints[1]);
          if (!_zoomStarted) {
            _zoomStarted = true;
            _shout('zoomGestureStarted');
          }

          // Distance between two points
          var pointsDistance = _calculatePointsDistance(p, p2);
          var zoomLevel = _calculateZoomLevel(pointsDistance);

          // slightly over the of initial zoom level
          if (zoomLevel > self.currItem.initialZoomLevel + self.currItem.initialZoomLevel / 15) {
            _wasOverInitialZoom = true;
          }

          // Apply the friction if zoom level is out of the bounds
          var zoomFriction = 1,
            minZoomLevel = _getMinZoomLevel(),
            maxZoomLevel = _getMaxZoomLevel();
          if (zoomLevel < minZoomLevel) {
            if (_options.pinchToClose && !_wasOverInitialZoom && _startZoomLevel <= self.currItem.initialZoomLevel) {
              // fade out background if zooming out
              var minusDiff = minZoomLevel - zoomLevel;
              var percent = 1 - minusDiff / (minZoomLevel / 1.2);
              _applyBgOpacity(percent);
              _shout('onPinchClose', percent);
              _opacityChanged = true;
            } else {
              zoomFriction = (minZoomLevel - zoomLevel) / minZoomLevel;
              if (zoomFriction > 1) {
                zoomFriction = 1;
              }
              zoomLevel = minZoomLevel - zoomFriction * (minZoomLevel / 3);
            }
          } else if (zoomLevel > maxZoomLevel) {
            // 1.5 - extra zoom level above the max. E.g. if max is x6, real max 6 + 1.5 = 7.5
            zoomFriction = (zoomLevel - maxZoomLevel) / (minZoomLevel * 6);
            if (zoomFriction > 1) {
              zoomFriction = 1;
            }
            zoomLevel = maxZoomLevel + zoomFriction * minZoomLevel;
          }
          if (zoomFriction < 0) {
            zoomFriction = 0;
          }

          // distance between touch points after friction is applied
          _currPointsDistance = pointsDistance;

          // _centerPoint - The point in the middle of two pointers
          _findCenterOfPoints(p, p2, _centerPoint);

          // paning with two pointers pressed
          _currPanDist.x += _centerPoint.x - _currCenterPoint.x;
          _currPanDist.y += _centerPoint.y - _currCenterPoint.y;
          _equalizePoints(_currCenterPoint, _centerPoint);
          _panOffset.x = _calculatePanOffset('x', zoomLevel);
          _panOffset.y = _calculatePanOffset('y', zoomLevel);
          _isZoomingIn = zoomLevel > _currZoomLevel;
          _currZoomLevel = zoomLevel;
          _applyCurrentZoomPan();
        } else {
          // handle behaviour for one point (dragging or panning)

          if (!_direction) {
            return;
          }
          if (_isFirstMove) {
            _isFirstMove = false;

            // subtract drag distance that was used during the detection direction  

            if (Math.abs(delta.x) >= DIRECTION_CHECK_OFFSET) {
              delta.x -= _currentPoints[0].x - _startPoint.x;
            }
            if (Math.abs(delta.y) >= DIRECTION_CHECK_OFFSET) {
              delta.y -= _currentPoints[0].y - _startPoint.y;
            }
          }
          _currPoint.x = p.x;
          _currPoint.y = p.y;

          // do nothing if pointers position hasn't changed
          if (delta.x === 0 && delta.y === 0) {
            return;
          }
          if (_direction === 'v' && _options.closeOnVerticalDrag) {
            if (!_canPan()) {
              _currPanDist.y += delta.y;
              _panOffset.y += delta.y;
              var opacityRatio = _calculateVerticalDragOpacityRatio();
              _verticalDragInitiated = true;
              _shout('onVerticalDrag', opacityRatio);
              _applyBgOpacity(opacityRatio);
              _applyCurrentZoomPan();
              return;
            }
          }
          _pushPosPoint(_getCurrentTime(), p.x, p.y);
          _moved = true;
          _currPanBounds = self.currItem.bounds;
          var mainScrollChanged = _panOrMoveMainScroll('x', delta);
          if (!mainScrollChanged) {
            _panOrMoveMainScroll('y', delta);
            _roundPoint(_panOffset);
            _applyCurrentZoomPan();
          }
        }
      },
      // Pointerup/pointercancel/touchend/touchcancel/mouseup event handler
      _onDragRelease = function _onDragRelease(e) {
        if (_features.isOldAndroid) {
          if (_oldAndroidTouchEndTimeout && e.type === 'mouseup') {
            return;
          }

          // on Android (v4.1, 4.2, 4.3 & possibly older) 
          // ghost mousedown/up event isn't preventable via e.preventDefault,
          // which causes fake mousedown event
          // so we block mousedown/up for 600ms
          if (e.type.indexOf('touch') > -1) {
            clearTimeout(_oldAndroidTouchEndTimeout);
            _oldAndroidTouchEndTimeout = setTimeout(function () {
              _oldAndroidTouchEndTimeout = 0;
            }, 600);
          }
        }
        _shout('pointerUp');
        if (_preventDefaultEventBehaviour(e, false)) {
          e.preventDefault();
        }
        var releasePoint;
        if (_pointerEventEnabled) {
          var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
          if (pointerIndex > -1) {
            releasePoint = _currPointers.splice(pointerIndex, 1)[0];
            if (navigator.pointerEnabled) {
              releasePoint.type = e.pointerType || 'mouse';
            } else {
              var MSPOINTER_TYPES = {
                4: 'mouse',
                // event.MSPOINTER_TYPE_MOUSE
                2: 'touch',
                // event.MSPOINTER_TYPE_TOUCH 
                3: 'pen' // event.MSPOINTER_TYPE_PEN
              };
              releasePoint.type = MSPOINTER_TYPES[e.pointerType];
              if (!releasePoint.type) {
                releasePoint.type = e.pointerType || 'mouse';
              }
            }
          }
        }
        var touchList = _getTouchPoints(e),
          gestureType,
          numPoints = touchList.length;
        if (e.type === 'mouseup') {
          numPoints = 0;
        }

        // Do nothing if there were 3 touch points or more
        if (numPoints === 2) {
          _currentPoints = null;
          return true;
        }

        // if second pointer released
        if (numPoints === 1) {
          _equalizePoints(_startPoint, touchList[0]);
        }

        // pointer hasn't moved, send "tap release" point
        if (numPoints === 0 && !_direction && !_mainScrollAnimating) {
          if (!releasePoint) {
            if (e.type === 'mouseup') {
              releasePoint = {
                x: e.pageX,
                y: e.pageY,
                type: 'mouse'
              };
            } else if (e.changedTouches && e.changedTouches[0]) {
              releasePoint = {
                x: e.changedTouches[0].pageX,
                y: e.changedTouches[0].pageY,
                type: 'touch'
              };
            }
          }
          _shout('touchRelease', e, releasePoint);
        }

        // Difference in time between releasing of two last touch points (zoom gesture)
        var releaseTimeDiff = -1;

        // Gesture completed, no pointers left
        if (numPoints === 0) {
          _isDragging = false;
          framework.unbind(window, _upMoveEvents, self);
          _stopDragUpdateLoop();
          if (_isZooming) {
            // Two points released at the same time
            releaseTimeDiff = 0;
          } else if (_lastReleaseTime !== -1) {
            releaseTimeDiff = _getCurrentTime() - _lastReleaseTime;
          }
        }
        _lastReleaseTime = numPoints === 1 ? _getCurrentTime() : -1;
        if (releaseTimeDiff !== -1 && releaseTimeDiff < 150) {
          gestureType = 'zoom';
        } else {
          gestureType = 'swipe';
        }
        if (_isZooming && numPoints < 2) {
          _isZooming = false;

          // Only second point released
          if (numPoints === 1) {
            gestureType = 'zoomPointerUp';
          }
          _shout('zoomGestureEnded');
        }
        _currentPoints = null;
        if (!_moved && !_zoomStarted && !_mainScrollAnimating && !_verticalDragInitiated) {
          // nothing to animate
          return;
        }
        _stopAllAnimations();
        if (!_releaseAnimData) {
          _releaseAnimData = _initDragReleaseAnimationData();
        }
        _releaseAnimData.calculateSwipeSpeed('x');
        if (_verticalDragInitiated) {
          var opacityRatio = _calculateVerticalDragOpacityRatio();
          if (opacityRatio < _options.verticalDragRange) {
            self.close();
          } else {
            var initalPanY = _panOffset.y,
              initialBgOpacity = _bgOpacity;
            _animateProp('verticalDrag', 0, 1, 300, framework.easing.cubic.out, function (now) {
              _panOffset.y = (self.currItem.initialPosition.y - initalPanY) * now + initalPanY;
              _applyBgOpacity((1 - initialBgOpacity) * now + initialBgOpacity);
              _applyCurrentZoomPan();
            });
            _shout('onVerticalDrag', 1);
          }
          return;
        }

        // main scroll 
        if ((_mainScrollShifted || _mainScrollAnimating) && numPoints === 0) {
          var itemChanged = _finishSwipeMainScrollGesture(gestureType, _releaseAnimData);
          if (itemChanged) {
            return;
          }
          gestureType = 'zoomPointerUp';
        }

        // prevent zoom/pan animation when main scroll animation runs
        if (_mainScrollAnimating) {
          return;
        }

        // Complete simple zoom gesture (reset zoom level if it's out of the bounds)  
        if (gestureType !== 'swipe') {
          _completeZoomGesture();
          return;
        }

        // Complete pan gesture if main scroll is not shifted, and it's possible to pan current image
        if (!_mainScrollShifted && _currZoomLevel > self.currItem.fitRatio) {
          _completePanGesture(_releaseAnimData);
        }
      },
      // Returns object with data about gesture
      // It's created only once and then reused
      _initDragReleaseAnimationData = function _initDragReleaseAnimationData() {
        // temp local vars
        var lastFlickDuration, tempReleasePos;

        // s = this
        var s = {
          lastFlickOffset: {},
          lastFlickDist: {},
          lastFlickSpeed: {},
          slowDownRatio: {},
          slowDownRatioReverse: {},
          speedDecelerationRatio: {},
          speedDecelerationRatioAbs: {},
          distanceOffset: {},
          backAnimDestination: {},
          backAnimStarted: {},
          calculateSwipeSpeed: function calculateSwipeSpeed(axis) {
            if (_posPoints.length > 1) {
              lastFlickDuration = _getCurrentTime() - _gestureCheckSpeedTime + 50;
              tempReleasePos = _posPoints[_posPoints.length - 2][axis];
            } else {
              lastFlickDuration = _getCurrentTime() - _gestureStartTime; // total gesture duration
              tempReleasePos = _startPoint[axis];
            }
            s.lastFlickOffset[axis] = _currPoint[axis] - tempReleasePos;
            s.lastFlickDist[axis] = Math.abs(s.lastFlickOffset[axis]);
            if (s.lastFlickDist[axis] > 20) {
              s.lastFlickSpeed[axis] = s.lastFlickOffset[axis] / lastFlickDuration;
            } else {
              s.lastFlickSpeed[axis] = 0;
            }
            if (Math.abs(s.lastFlickSpeed[axis]) < 0.1) {
              s.lastFlickSpeed[axis] = 0;
            }
            s.slowDownRatio[axis] = 0.95;
            s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
            s.speedDecelerationRatio[axis] = 1;
          },
          calculateOverBoundsAnimOffset: function calculateOverBoundsAnimOffset(axis, speed) {
            if (!s.backAnimStarted[axis]) {
              if (_panOffset[axis] > _currPanBounds.min[axis]) {
                s.backAnimDestination[axis] = _currPanBounds.min[axis];
              } else if (_panOffset[axis] < _currPanBounds.max[axis]) {
                s.backAnimDestination[axis] = _currPanBounds.max[axis];
              }
              if (s.backAnimDestination[axis] !== undefined) {
                s.slowDownRatio[axis] = 0.7;
                s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
                if (s.speedDecelerationRatioAbs[axis] < 0.05) {
                  s.lastFlickSpeed[axis] = 0;
                  s.backAnimStarted[axis] = true;
                  _animateProp('bounceZoomPan' + axis, _panOffset[axis], s.backAnimDestination[axis], speed || 300, framework.easing.sine.out, function (pos) {
                    _panOffset[axis] = pos;
                    _applyCurrentZoomPan();
                  });
                }
              }
            }
          },
          // Reduces the speed by slowDownRatio (per 10ms)
          calculateAnimOffset: function calculateAnimOffset(axis) {
            if (!s.backAnimStarted[axis]) {
              s.speedDecelerationRatio[axis] = s.speedDecelerationRatio[axis] * (s.slowDownRatio[axis] + s.slowDownRatioReverse[axis] - s.slowDownRatioReverse[axis] * s.timeDiff / 10);
              s.speedDecelerationRatioAbs[axis] = Math.abs(s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis]);
              s.distanceOffset[axis] = s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis] * s.timeDiff;
              _panOffset[axis] += s.distanceOffset[axis];
            }
          },
          panAnimLoop: function panAnimLoop() {
            if (_animations.zoomPan) {
              _animations.zoomPan.raf = _requestAF(s.panAnimLoop);
              s.now = _getCurrentTime();
              s.timeDiff = s.now - s.lastNow;
              s.lastNow = s.now;
              s.calculateAnimOffset('x');
              s.calculateAnimOffset('y');
              _applyCurrentZoomPan();
              s.calculateOverBoundsAnimOffset('x');
              s.calculateOverBoundsAnimOffset('y');
              if (s.speedDecelerationRatioAbs.x < 0.05 && s.speedDecelerationRatioAbs.y < 0.05) {
                // round pan position
                _panOffset.x = Math.round(_panOffset.x);
                _panOffset.y = Math.round(_panOffset.y);
                _applyCurrentZoomPan();
                _stopAnimation('zoomPan');
                return;
              }
            }
          }
        };
        return s;
      },
      _completePanGesture = function _completePanGesture(animData) {
        // calculate swipe speed for Y axis (paanning)
        animData.calculateSwipeSpeed('y');
        _currPanBounds = self.currItem.bounds;
        animData.backAnimDestination = {};
        animData.backAnimStarted = {};

        // Avoid acceleration animation if speed is too low
        if (Math.abs(animData.lastFlickSpeed.x) <= 0.05 && Math.abs(animData.lastFlickSpeed.y) <= 0.05) {
          animData.speedDecelerationRatioAbs.x = animData.speedDecelerationRatioAbs.y = 0;

          // Run pan drag release animation. E.g. if you drag image and release finger without momentum.
          animData.calculateOverBoundsAnimOffset('x');
          animData.calculateOverBoundsAnimOffset('y');
          return true;
        }

        // Animation loop that controls the acceleration after pan gesture ends
        _registerStartAnimation('zoomPan');
        animData.lastNow = _getCurrentTime();
        animData.panAnimLoop();
      },
      _finishSwipeMainScrollGesture = function _finishSwipeMainScrollGesture(gestureType, _releaseAnimData) {
        var itemChanged;
        if (!_mainScrollAnimating) {
          _currZoomedItemIndex = _currentItemIndex;
        }
        var itemsDiff;
        if (gestureType === 'swipe') {
          var totalShiftDist = _currPoint.x - _startPoint.x,
            isFastLastFlick = _releaseAnimData.lastFlickDist.x < 10;

          // if container is shifted for more than MIN_SWIPE_DISTANCE, 
          // and last flick gesture was in right direction
          if (totalShiftDist > MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x > 20)) {
            // go to prev item
            itemsDiff = -1;
          } else if (totalShiftDist < -MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x < -20)) {
            // go to next item
            itemsDiff = 1;
          }
        }
        var nextCircle;
        if (itemsDiff) {
          _currentItemIndex += itemsDiff;
          if (_currentItemIndex < 0) {
            _currentItemIndex = _options.loop ? _getNumItems() - 1 : 0;
            nextCircle = true;
          } else if (_currentItemIndex >= _getNumItems()) {
            _currentItemIndex = _options.loop ? 0 : _getNumItems() - 1;
            nextCircle = true;
          }
          if (!nextCircle || _options.loop) {
            _indexDiff += itemsDiff;
            _currPositionIndex -= itemsDiff;
            itemChanged = true;
          }
        }
        var animateToX = _slideSize.x * _currPositionIndex;
        var animateToDist = Math.abs(animateToX - _mainScrollPos.x);
        var finishAnimDuration;
        if (!itemChanged && animateToX > _mainScrollPos.x !== _releaseAnimData.lastFlickSpeed.x > 0) {
          // "return to current" duration, e.g. when dragging from slide 0 to -1
          finishAnimDuration = 333;
        } else {
          finishAnimDuration = Math.abs(_releaseAnimData.lastFlickSpeed.x) > 0 ? animateToDist / Math.abs(_releaseAnimData.lastFlickSpeed.x) : 333;
          finishAnimDuration = Math.min(finishAnimDuration, 400);
          finishAnimDuration = Math.max(finishAnimDuration, 250);
        }
        if (_currZoomedItemIndex === _currentItemIndex) {
          itemChanged = false;
        }
        _mainScrollAnimating = true;
        _shout('mainScrollAnimStart');
        _animateProp('mainScroll', _mainScrollPos.x, animateToX, finishAnimDuration, framework.easing.cubic.out, _moveMainScroll, function () {
          _stopAllAnimations();
          _mainScrollAnimating = false;
          _currZoomedItemIndex = -1;
          if (itemChanged || _currZoomedItemIndex !== _currentItemIndex) {
            self.updateCurrItem();
          }
          _shout('mainScrollAnimComplete');
        });
        if (itemChanged) {
          self.updateCurrItem(true);
        }
        return itemChanged;
      },
      _calculateZoomLevel = function _calculateZoomLevel(touchesDistance) {
        return 1 / _startPointsDistance * touchesDistance * _startZoomLevel;
      },
      // Resets zoom if it's out of bounds
      _completeZoomGesture = function _completeZoomGesture() {
        var destZoomLevel = _currZoomLevel,
          minZoomLevel = _getMinZoomLevel(),
          maxZoomLevel = _getMaxZoomLevel();
        if (_currZoomLevel < minZoomLevel) {
          destZoomLevel = minZoomLevel;
        } else if (_currZoomLevel > maxZoomLevel) {
          destZoomLevel = maxZoomLevel;
        }
        var destOpacity = 1,
          onUpdate,
          initialOpacity = _bgOpacity;
        if (_opacityChanged && !_isZoomingIn && !_wasOverInitialZoom && _currZoomLevel < minZoomLevel) {
          //_closedByScroll = true;
          self.close();
          return true;
        }
        if (_opacityChanged) {
          onUpdate = function onUpdate(now) {
            _applyBgOpacity((destOpacity - initialOpacity) * now + initialOpacity);
          };
        }
        self.zoomTo(destZoomLevel, 0, 200, framework.easing.cubic.out, onUpdate);
        return true;
      };
    _registerModule('Gestures', {
      publicMethods: {
        initGestures: function initGestures() {
          // helper function that builds touch/pointer/mouse events
          var addEventNames = function addEventNames(pref, down, move, up, cancel) {
            _dragStartEvent = pref + down;
            _dragMoveEvent = pref + move;
            _dragEndEvent = pref + up;
            if (cancel) {
              _dragCancelEvent = pref + cancel;
            } else {
              _dragCancelEvent = '';
            }
          };
          _pointerEventEnabled = _features.pointerEvent;
          if (_pointerEventEnabled && _features.touch) {
            // we don't need touch events, if browser supports pointer events
            _features.touch = false;
          }
          if (_pointerEventEnabled) {
            if (navigator.pointerEnabled) {
              addEventNames('pointer', 'down', 'move', 'up', 'cancel');
            } else {
              // IE10 pointer events are case-sensitive
              addEventNames('MSPointer', 'Down', 'Move', 'Up', 'Cancel');
            }
          } else if (_features.touch) {
            addEventNames('touch', 'start', 'move', 'end', 'cancel');
            _likelyTouchDevice = true;
          } else {
            addEventNames('mouse', 'down', 'move', 'up');
          }
          _upMoveEvents = _dragMoveEvent + ' ' + _dragEndEvent + ' ' + _dragCancelEvent;
          _downEvents = _dragStartEvent;
          if (_pointerEventEnabled && !_likelyTouchDevice) {
            _likelyTouchDevice = navigator.maxTouchPoints > 1 || navigator.msMaxTouchPoints > 1;
          }
          // make variable public
          self.likelyTouchDevice = _likelyTouchDevice;
          _globalEventHandlers[_dragStartEvent] = _onDragStart;
          _globalEventHandlers[_dragMoveEvent] = _onDragMove;
          _globalEventHandlers[_dragEndEvent] = _onDragRelease; // the Kraken

          if (_dragCancelEvent) {
            _globalEventHandlers[_dragCancelEvent] = _globalEventHandlers[_dragEndEvent];
          }

          // Bind mouse events on device with detected hardware touch support, in case it supports multiple types of input.
          if (_features.touch) {
            _downEvents += ' mousedown';
            _upMoveEvents += ' mousemove mouseup';
            _globalEventHandlers.mousedown = _globalEventHandlers[_dragStartEvent];
            _globalEventHandlers.mousemove = _globalEventHandlers[_dragMoveEvent];
            _globalEventHandlers.mouseup = _globalEventHandlers[_dragEndEvent];
          }
          if (!_likelyTouchDevice) {
            // don't allow pan to next slide from zoomed state on Desktop
            _options.allowPanToNext = false;
          }
        }
      }
    });

    /*>>gestures*/

    /*>>show-hide-transition*/
    /**
     * show-hide-transition.js:
     *
     * Manages initial opening or closing transition.
     *
     * If you're not planning to use transition for gallery at all,
     * you may set options hideAnimationDuration and showAnimationDuration to 0,
     * and just delete startAnimation function.
     * 
     */

    var _showOrHideTimeout,
      _showOrHide = function _showOrHide(item, img, out, completeFn) {
        if (_showOrHideTimeout) {
          clearTimeout(_showOrHideTimeout);
        }
        _initialZoomRunning = true;
        _initialContentSet = true;

        // dimensions of small thumbnail {x:,y:,w:}.
        // Height is optional, as calculated based on large image.
        var thumbBounds;
        if (item.initialLayout) {
          thumbBounds = item.initialLayout;
          item.initialLayout = null;
        } else {
          thumbBounds = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
        }
        var duration = out ? _options.hideAnimationDuration : _options.showAnimationDuration;
        var onComplete = function onComplete() {
          _stopAnimation('initialZoom');
          if (!out) {
            _applyBgOpacity(1);
            if (img) {
              img.style.display = 'block';
            }
            framework.addClass(template, 'pswp--animated-in');
            _shout('initialZoom' + (out ? 'OutEnd' : 'InEnd'));
          } else {
            self.template.removeAttribute('style');
            self.bg.removeAttribute('style');
          }
          if (completeFn) {
            completeFn();
          }
          _initialZoomRunning = false;
        };

        // if bounds aren't provided, just open gallery without animation
        if (!duration || !thumbBounds || thumbBounds.x === undefined) {
          _shout('initialZoom' + (out ? 'Out' : 'In'));
          _currZoomLevel = item.initialZoomLevel;
          _equalizePoints(_panOffset, item.initialPosition);
          _applyCurrentZoomPan();
          template.style.opacity = out ? 0 : 1;
          _applyBgOpacity(1);
          if (duration) {
            setTimeout(function () {
              onComplete();
            }, duration);
          } else {
            onComplete();
          }
          return;
        }
        var startAnimation = function startAnimation() {
          var closeWithRaf = _closedByScroll,
            fadeEverything = !self.currItem.src || self.currItem.loadError || _options.showHideOpacity;

          // apply hw-acceleration to image
          if (item.miniImg) {
            item.miniImg.style.webkitBackfaceVisibility = 'hidden';
          }
          if (!out) {
            _currZoomLevel = thumbBounds.w / item.w;
            _panOffset.x = thumbBounds.x;
            _panOffset.y = thumbBounds.y - _initalWindowScrollY;
            self[fadeEverything ? 'template' : 'bg'].style.opacity = 0.001;
            _applyCurrentZoomPan();
          }
          _registerStartAnimation('initialZoom');
          if (out && !closeWithRaf) {
            framework.removeClass(template, 'pswp--animated-in');
          }
          if (fadeEverything) {
            if (out) {
              framework[(closeWithRaf ? 'remove' : 'add') + 'Class'](template, 'pswp--animate_opacity');
            } else {
              setTimeout(function () {
                framework.addClass(template, 'pswp--animate_opacity');
              }, 30);
            }
          }
          _showOrHideTimeout = setTimeout(function () {
            _shout('initialZoom' + (out ? 'Out' : 'In'));
            if (!out) {
              // "in" animation always uses CSS transitions (instead of rAF).
              // CSS transition work faster here, 
              // as developer may also want to animate other things, 
              // like ui on top of sliding area, which can be animated just via CSS

              _currZoomLevel = item.initialZoomLevel;
              _equalizePoints(_panOffset, item.initialPosition);
              _applyCurrentZoomPan();
              _applyBgOpacity(1);
              if (fadeEverything) {
                template.style.opacity = 1;
              } else {
                _applyBgOpacity(1);
              }
              _showOrHideTimeout = setTimeout(onComplete, duration + 20);
            } else {
              // "out" animation uses rAF only when PhotoSwipe is closed by browser scroll, to recalculate position
              var destZoomLevel = thumbBounds.w / item.w,
                initialPanOffset = {
                  x: _panOffset.x,
                  y: _panOffset.y
                },
                initialZoomLevel = _currZoomLevel,
                initalBgOpacity = _bgOpacity,
                onUpdate = function onUpdate(now) {
                  if (now === 1) {
                    _currZoomLevel = destZoomLevel;
                    _panOffset.x = thumbBounds.x;
                    _panOffset.y = thumbBounds.y - _currentWindowScrollY;
                  } else {
                    _currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
                    _panOffset.x = (thumbBounds.x - initialPanOffset.x) * now + initialPanOffset.x;
                    _panOffset.y = (thumbBounds.y - _currentWindowScrollY - initialPanOffset.y) * now + initialPanOffset.y;
                  }
                  _applyCurrentZoomPan();
                  if (fadeEverything) {
                    template.style.opacity = 1 - now;
                  } else {
                    _applyBgOpacity(initalBgOpacity - now * initalBgOpacity);
                  }
                };
              if (closeWithRaf) {
                _animateProp('initialZoom', 0, 1, duration, framework.easing.cubic.out, onUpdate, onComplete);
              } else {
                onUpdate(1);
                _showOrHideTimeout = setTimeout(onComplete, duration + 20);
              }
            }
          }, out ? 25 : 90); // Main purpose of this delay is to give browser time to paint and
          // create composite layers of PhotoSwipe UI parts (background, controls, caption, arrows).
          // Which avoids lag at the beginning of scale transition.
        };
        startAnimation();
      };

    /*>>show-hide-transition*/

    /*>>items-controller*/
    /**
    *
    * Controller manages gallery items, their dimensions, and their content.
    * 
    */

    var _items,
      _tempPanAreaSize = {},
      _imagesToAppendPool = [],
      _initialContentSet,
      _initialZoomRunning,
      _controllerDefaultOptions = {
        index: 0,
        errorMsg: '<div class="pswp__error-msg"><a href="%url%" target="_blank">The image</a> could not be loaded.</div>',
        forceProgressiveLoading: false,
        // TODO
        preload: [1, 1],
        getNumItemsFn: function getNumItemsFn() {
          return _items.length;
        }
      };
    var _getItemAt,
      _getNumItems,
      _initialIsLoop,
      _getZeroBounds = function _getZeroBounds() {
        return {
          center: {
            x: 0,
            y: 0
          },
          max: {
            x: 0,
            y: 0
          },
          min: {
            x: 0,
            y: 0
          }
        };
      },
      _calculateSingleItemPanBounds = function _calculateSingleItemPanBounds(item, realPanElementW, realPanElementH) {
        var bounds = item.bounds;

        // position of element when it's centered
        bounds.center.x = Math.round((_tempPanAreaSize.x - realPanElementW) / 2);
        bounds.center.y = Math.round((_tempPanAreaSize.y - realPanElementH) / 2) + item.vGap.top;

        // maximum pan position
        bounds.max.x = realPanElementW > _tempPanAreaSize.x ? Math.round(_tempPanAreaSize.x - realPanElementW) : bounds.center.x;
        bounds.max.y = realPanElementH > _tempPanAreaSize.y ? Math.round(_tempPanAreaSize.y - realPanElementH) + item.vGap.top : bounds.center.y;

        // minimum pan position
        bounds.min.x = realPanElementW > _tempPanAreaSize.x ? 0 : bounds.center.x;
        bounds.min.y = realPanElementH > _tempPanAreaSize.y ? item.vGap.top : bounds.center.y;
      },
      _calculateItemSize = function _calculateItemSize(item, viewportSize, zoomLevel) {
        if (item.src && !item.loadError) {
          var isInitial = !zoomLevel;
          if (isInitial) {
            if (!item.vGap) {
              item.vGap = {
                top: 0,
                bottom: 0
              };
            }
            // allows overriding vertical margin for individual items
            _shout('parseVerticalMargin', item);
          }
          _tempPanAreaSize.x = viewportSize.x;
          _tempPanAreaSize.y = viewportSize.y - item.vGap.top - item.vGap.bottom;
          if (isInitial) {
            var hRatio = _tempPanAreaSize.x / item.w;
            var vRatio = _tempPanAreaSize.y / item.h;
            item.fitRatio = hRatio < vRatio ? hRatio : vRatio;
            //item.fillRatio = hRatio > vRatio ? hRatio : vRatio;

            var scaleMode = _options.scaleMode;
            if (scaleMode === 'orig') {
              zoomLevel = 1;
            } else if (scaleMode === 'fit') {
              zoomLevel = item.fitRatio;
            }
            if (zoomLevel > 1) {
              zoomLevel = 1;
            }
            item.initialZoomLevel = zoomLevel;
            if (!item.bounds) {
              // reuse bounds object
              item.bounds = _getZeroBounds();
            }
          }
          if (!zoomLevel) {
            return;
          }
          _calculateSingleItemPanBounds(item, item.w * zoomLevel, item.h * zoomLevel);
          if (isInitial && zoomLevel === item.initialZoomLevel) {
            item.initialPosition = item.bounds.center;
          }
          return item.bounds;
        } else {
          item.w = item.h = 0;
          item.initialZoomLevel = item.fitRatio = 1;
          item.bounds = _getZeroBounds();
          item.initialPosition = item.bounds.center;

          // if it's not image, we return zero bounds (content is not zoomable)
          return item.bounds;
        }
      },
      _appendImage = function _appendImage(index, item, baseDiv, img, preventAnimation, keepPlaceholder) {
        if (item.loadError) {
          return;
        }
        if (img) {
          item.imageAppended = true;
          _setImageSize(item, img, item === self.currItem && _renderMaxResolution);
          baseDiv.appendChild(img);
          if (keepPlaceholder) {
            setTimeout(function () {
              if (item && item.loaded && item.placeholder) {
                item.placeholder.style.display = 'none';
                item.placeholder = null;
              }
            }, 500);
          }
        }
      },
      _preloadImage = function _preloadImage(item) {
        item.loading = true;
        item.loaded = false;
        var img = item.img = framework.createEl('pswp__img', 'img');
        var onComplete = function onComplete() {
          item.loading = false;
          item.loaded = true;
          if (item.loadComplete) {
            item.loadComplete(item);
          } else {
            item.img = null; // no need to store image object
          }
          img.onload = img.onerror = null;
          img = null;
        };
        img.onload = onComplete;
        img.onerror = function () {
          item.loadError = true;
          onComplete();
        };
        img.src = item.src; // + '?a=' + Math.random();

        return img;
      },
      _checkForError = function _checkForError(item, cleanUp) {
        if (item.src && item.loadError && item.container) {
          if (cleanUp) {
            item.container.innerHTML = '';
          }
          item.container.innerHTML = _options.errorMsg.replace('%url%', item.src);
          return true;
        }
      },
      _setImageSize = function _setImageSize(item, img, maxRes) {
        if (!item.src) {
          return;
        }
        if (!img) {
          img = item.container.lastChild;
        }
        var w = maxRes ? item.w : Math.round(item.w * item.fitRatio),
          h = maxRes ? item.h : Math.round(item.h * item.fitRatio);
        if (item.placeholder && !item.loaded) {
          item.placeholder.style.width = w + 'px';
          item.placeholder.style.height = h + 'px';
        }
        img.style.width = w + 'px';
        img.style.height = h + 'px';
      },
      _appendImagesPool = function _appendImagesPool() {
        if (_imagesToAppendPool.length) {
          var poolItem;
          for (var i = 0; i < _imagesToAppendPool.length; i++) {
            poolItem = _imagesToAppendPool[i];
            if (poolItem.holder.index === poolItem.index) {
              _appendImage(poolItem.index, poolItem.item, poolItem.baseDiv, poolItem.img, false, poolItem.clearPlaceholder);
            }
          }
          _imagesToAppendPool = [];
        }
      };
    _registerModule('Controller', {
      publicMethods: {
        lazyLoadItem: function lazyLoadItem(index) {
          index = _getLoopedId(index);
          var item = _getItemAt(index);
          if (!item || (item.loaded || item.loading) && !_itemsNeedUpdate) {
            return;
          }
          _shout('gettingData', index, item);
          if (!item.src) {
            return;
          }
          _preloadImage(item);
        },
        initController: function initController() {
          framework.extend(_options, _controllerDefaultOptions, true);
          self.items = _items = items;
          _getItemAt = self.getItemAt;
          _getNumItems = _options.getNumItemsFn; //self.getNumItems;

          _initialIsLoop = _options.loop;
          if (_getNumItems() < 3) {
            _options.loop = false; // disable loop if less then 3 items
          }
          _listen('beforeChange', function (diff) {
            var p = _options.preload,
              isNext = diff === null ? true : diff >= 0,
              preloadBefore = Math.min(p[0], _getNumItems()),
              preloadAfter = Math.min(p[1], _getNumItems()),
              i;
            for (i = 1; i <= (isNext ? preloadAfter : preloadBefore); i++) {
              self.lazyLoadItem(_currentItemIndex + i);
            }
            for (i = 1; i <= (isNext ? preloadBefore : preloadAfter); i++) {
              self.lazyLoadItem(_currentItemIndex - i);
            }
          });
          _listen('initialLayout', function () {
            self.currItem.initialLayout = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
          });
          _listen('mainScrollAnimComplete', _appendImagesPool);
          _listen('initialZoomInEnd', _appendImagesPool);
          _listen('destroy', function () {
            var item;
            for (var i = 0; i < _items.length; i++) {
              item = _items[i];
              // remove reference to DOM elements, for GC
              if (item.container) {
                item.container = null;
              }
              if (item.placeholder) {
                item.placeholder = null;
              }
              if (item.img) {
                item.img = null;
              }
              if (item.preloader) {
                item.preloader = null;
              }
              if (item.loadError) {
                item.loaded = item.loadError = false;
              }
            }
            _imagesToAppendPool = null;
          });
        },
        getItemAt: function getItemAt(index) {
          if (index >= 0) {
            return _items[index] !== undefined ? _items[index] : false;
          }
          return false;
        },
        allowProgressiveImg: function allowProgressiveImg() {
          // 1. Progressive image loading isn't working on webkit/blink 
          //    when hw-acceleration (e.g. translateZ) is applied to IMG element.
          //    That's why in PhotoSwipe parent element gets zoom transform, not image itself.
          //    
          // 2. Progressive image loading sometimes blinks in webkit/blink when applying animation to parent element.
          //    That's why it's disabled on touch devices (mainly because of swipe transition)
          //    
          // 3. Progressive image loading sometimes doesn't work in IE (up to 11).

          // Don't allow progressive loading on non-large touch devices
          return _options.forceProgressiveLoading || !_likelyTouchDevice || _options.mouseUsed || screen.width > 1200;
          // 1200 - to eliminate touch devices with large screen (like Chromebook Pixel)
        },
        setContent: function setContent(holder, index) {
          if (_options.loop) {
            index = _getLoopedId(index);
          }
          var prevItem = self.getItemAt(holder.index);
          if (prevItem) {
            prevItem.container = null;
          }
          var item = self.getItemAt(index),
            img;
          if (!item) {
            holder.el.innerHTML = '';
            return;
          }

          // allow to override data
          _shout('gettingData', index, item);
          holder.index = index;
          holder.item = item;

          // base container DIV is created only once for each of 3 holders
          var baseDiv = item.container = framework.createEl('pswp__zoom-wrap');
          if (!item.src && item.html) {
            if (item.html.tagName) {
              baseDiv.appendChild(item.html);
            } else {
              baseDiv.innerHTML = item.html;
            }
          }
          _checkForError(item);
          _calculateItemSize(item, _viewportSize);
          if (item.src && !item.loadError && !item.loaded) {
            item.loadComplete = function (item) {
              // gallery closed before image finished loading
              if (!_isOpen) {
                return;
              }

              // check if holder hasn't changed while image was loading
              if (holder && holder.index === index) {
                if (_checkForError(item, true)) {
                  item.loadComplete = item.img = null;
                  _calculateItemSize(item, _viewportSize);
                  _applyZoomPanToItem(item);
                  if (holder.index === _currentItemIndex) {
                    // recalculate dimensions
                    self.updateCurrZoomItem();
                  }
                  return;
                }
                if (!item.imageAppended) {
                  if (_features.transform && (_mainScrollAnimating || _initialZoomRunning)) {
                    _imagesToAppendPool.push({
                      item: item,
                      baseDiv: baseDiv,
                      img: item.img,
                      index: index,
                      holder: holder,
                      clearPlaceholder: true
                    });
                  } else {
                    _appendImage(index, item, baseDiv, item.img, _mainScrollAnimating || _initialZoomRunning, true);
                  }
                } else {
                  // remove preloader & mini-img
                  if (!_initialZoomRunning && item.placeholder) {
                    item.placeholder.style.display = 'none';
                    item.placeholder = null;
                  }
                }
              }
              item.loadComplete = null;
              item.img = null; // no need to store image element after it's added

              _shout('imageLoadComplete', index, item);
            };
            if (framework.features.transform) {
              var placeholderClassName = 'pswp__img pswp__img--placeholder';
              placeholderClassName += item.msrc ? '' : ' pswp__img--placeholder--blank';
              var placeholder = framework.createEl(placeholderClassName, item.msrc ? 'img' : '');
              if (item.msrc) {
                placeholder.src = item.msrc;
              }
              _setImageSize(item, placeholder);
              baseDiv.appendChild(placeholder);
              item.placeholder = placeholder;
            }
            if (!item.loading) {
              _preloadImage(item);
            }
            if (self.allowProgressiveImg()) {
              // just append image
              if (!_initialContentSet && _features.transform) {
                _imagesToAppendPool.push({
                  item: item,
                  baseDiv: baseDiv,
                  img: item.img,
                  index: index,
                  holder: holder
                });
              } else {
                _appendImage(index, item, baseDiv, item.img, true, true);
              }
            }
          } else if (item.src && !item.loadError) {
            // image object is created every time, due to bugs of image loading & delay when switching images
            img = framework.createEl('pswp__img', 'img');
            img.style.opacity = 1;
            img.src = item.src;
            _setImageSize(item, img);
            _appendImage(index, item, baseDiv, img, true);
          }
          if (!_initialContentSet && index === _currentItemIndex) {
            _currZoomElementStyle = baseDiv.style;
            _showOrHide(item, img || item.img);
          } else {
            _applyZoomPanToItem(item);
          }
          holder.el.innerHTML = '';
          holder.el.appendChild(baseDiv);
        },
        cleanSlide: function cleanSlide(item) {
          if (item.img) {
            item.img.onload = item.img.onerror = null;
          }
          item.loaded = item.loading = item.img = item.imageAppended = false;
        }
      }
    });

    /*>>items-controller*/

    /*>>tap*/
    /**
     * tap.js:
     *
     * Displatches tap and double-tap events.
     * 
     */

    var tapTimer,
      tapReleasePoint = {},
      _dispatchTapEvent = function _dispatchTapEvent(origEvent, releasePoint, pointerType) {
        var e = document.createEvent('CustomEvent'),
          eDetail = {
            origEvent: origEvent,
            target: origEvent.target,
            releasePoint: releasePoint,
            pointerType: pointerType || 'touch'
          };
        e.initCustomEvent('pswpTap', true, true, eDetail);
        origEvent.target.dispatchEvent(e);
      };
    _registerModule('Tap', {
      publicMethods: {
        initTap: function initTap() {
          _listen('firstTouchStart', self.onTapStart);
          _listen('touchRelease', self.onTapRelease);
          _listen('destroy', function () {
            tapReleasePoint = {};
            tapTimer = null;
          });
        },
        onTapStart: function onTapStart(touchList) {
          if (touchList.length > 1) {
            clearTimeout(tapTimer);
            tapTimer = null;
          }
        },
        onTapRelease: function onTapRelease(e, releasePoint) {
          if (!releasePoint) {
            return;
          }
          if (!_moved && !_isMultitouch && !_numAnimations) {
            var p0 = releasePoint;
            if (tapTimer) {
              clearTimeout(tapTimer);
              tapTimer = null;

              // Check if taped on the same place
              if (_isNearbyPoints(p0, tapReleasePoint)) {
                _shout('doubleTap', p0);
                return;
              }
            }
            if (releasePoint.type === 'mouse') {
              _dispatchTapEvent(e, releasePoint, 'mouse');
              return;
            }
            var clickedTagName = e.target.tagName.toUpperCase();
            // avoid double tap delay on buttons and elements that have class pswp__single-tap
            if (clickedTagName === 'BUTTON' || framework.hasClass(e.target, 'pswp__single-tap')) {
              _dispatchTapEvent(e, releasePoint);
              return;
            }
            _equalizePoints(tapReleasePoint, p0);
            tapTimer = setTimeout(function () {
              _dispatchTapEvent(e, releasePoint);
              tapTimer = null;
            }, 300);
          }
        }
      }
    });

    /*>>tap*/

    /*>>desktop-zoom*/
    /**
     *
     * desktop-zoom.js:
     *
     * - Binds mousewheel event for paning zoomed image.
     * - Manages "dragging", "zoomed-in", "zoom-out" classes.
     *   (which are used for cursors and zoom icon)
     * - Adds toggleDesktopZoom function.
     * 
     */

    var _wheelDelta;
    _registerModule('DesktopZoom', {
      publicMethods: {
        initDesktopZoom: function initDesktopZoom() {
          if (_oldIE) {
            // no zoom for old IE (<=8)
            return;
          }
          if (_likelyTouchDevice) {
            // if detected hardware touch support, we wait until mouse is used,
            // and only then apply desktop-zoom features
            _listen('mouseUsed', function () {
              self.setupDesktopZoom();
            });
          } else {
            self.setupDesktopZoom(true);
          }
        },
        setupDesktopZoom: function setupDesktopZoom(onInit) {
          _wheelDelta = {};
          var events = 'wheel mousewheel DOMMouseScroll';
          _listen('bindEvents', function () {
            framework.bind(template, events, self.handleMouseWheel);
          });
          _listen('unbindEvents', function () {
            if (_wheelDelta) {
              framework.unbind(template, events, self.handleMouseWheel);
            }
          });
          self.mouseZoomedIn = false;
          var hasDraggingClass,
            updateZoomable = function updateZoomable() {
              if (self.mouseZoomedIn) {
                framework.removeClass(template, 'pswp--zoomed-in');
                self.mouseZoomedIn = false;
              }
              if (_currZoomLevel < 1) {
                framework.addClass(template, 'pswp--zoom-allowed');
              } else {
                framework.removeClass(template, 'pswp--zoom-allowed');
              }
              removeDraggingClass();
            },
            removeDraggingClass = function removeDraggingClass() {
              if (hasDraggingClass) {
                framework.removeClass(template, 'pswp--dragging');
                hasDraggingClass = false;
              }
            };
          _listen('resize', updateZoomable);
          _listen('afterChange', updateZoomable);
          _listen('pointerDown', function () {
            if (self.mouseZoomedIn) {
              hasDraggingClass = true;
              framework.addClass(template, 'pswp--dragging');
            }
          });
          _listen('pointerUp', removeDraggingClass);
          if (!onInit) {
            updateZoomable();
          }
        },
        handleMouseWheel: function handleMouseWheel(e) {
          if (_currZoomLevel <= self.currItem.fitRatio) {
            if (_options.modal) {
              if (!_options.closeOnScroll || _numAnimations || _isDragging) {
                e.preventDefault();
              } else if (_transformKey && Math.abs(e.deltaY) > 2) {
                // close PhotoSwipe
                // if browser supports transforms & scroll changed enough
                _closedByScroll = true;
                self.close();
              }
            }
            return true;
          }

          // allow just one event to fire
          e.stopPropagation();

          // https://developer.mozilla.org/en-US/docs/Web/Events/wheel
          _wheelDelta.x = 0;
          if ('deltaX' in e) {
            if (e.deltaMode === 1 /* DOM_DELTA_LINE */) {
              // 18 - average line height
              _wheelDelta.x = e.deltaX * 18;
              _wheelDelta.y = e.deltaY * 18;
            } else {
              _wheelDelta.x = e.deltaX;
              _wheelDelta.y = e.deltaY;
            }
          } else if ('wheelDelta' in e) {
            if (e.wheelDeltaX) {
              _wheelDelta.x = -0.16 * e.wheelDeltaX;
            }
            if (e.wheelDeltaY) {
              _wheelDelta.y = -0.16 * e.wheelDeltaY;
            } else {
              _wheelDelta.y = -0.16 * e.wheelDelta;
            }
          } else if ('detail' in e) {
            _wheelDelta.y = e.detail;
          } else {
            return;
          }
          _calculatePanBounds(_currZoomLevel, true);
          var newPanX = _panOffset.x - _wheelDelta.x,
            newPanY = _panOffset.y - _wheelDelta.y;

          // only prevent scrolling in nonmodal mode when not at edges
          if (_options.modal || newPanX <= _currPanBounds.min.x && newPanX >= _currPanBounds.max.x && newPanY <= _currPanBounds.min.y && newPanY >= _currPanBounds.max.y) {
            e.preventDefault();
          }

          // TODO: use rAF instead of mousewheel?
          self.panTo(newPanX, newPanY);
        },
        toggleDesktopZoom: function toggleDesktopZoom(centerPoint) {
          centerPoint = centerPoint || {
            x: _viewportSize.x / 2 + _offset.x,
            y: _viewportSize.y / 2 + _offset.y
          };
          var doubleTapZoomLevel = _options.getDoubleTapZoom(true, self.currItem);
          var zoomOut = _currZoomLevel === doubleTapZoomLevel;
          self.mouseZoomedIn = !zoomOut;
          self.zoomTo(zoomOut ? self.currItem.initialZoomLevel : doubleTapZoomLevel, centerPoint, 333);
          framework[(!zoomOut ? 'add' : 'remove') + 'Class'](template, 'pswp--zoomed-in');
        }
      }
    });

    /*>>desktop-zoom*/

    /*>>history*/
    /**
     *
     * history.js:
     *
     * - Back button to close gallery.
     * 
     * - Unique URL for each slide: example.com/&pid=1&gid=3
     *   (where PID is picture index, and GID and gallery index)
     *   
     * - Switch URL when slides change.
     * 
     */

    var _historyDefaultOptions = {
      history: true,
      galleryUID: 1
    };
    var _historyUpdateTimeout,
      _hashChangeTimeout,
      _hashAnimCheckTimeout,
      _hashChangedByScript,
      _hashChangedByHistory,
      _hashReseted,
      _initialHash,
      _historyChanged,
      _closedFromURL,
      _urlChangedOnce,
      _windowLoc,
      _supportsPushState,
      _getHash = function _getHash() {
        return _windowLoc.hash.substring(1);
      },
      _cleanHistoryTimeouts = function _cleanHistoryTimeouts() {
        if (_historyUpdateTimeout) {
          clearTimeout(_historyUpdateTimeout);
        }
        if (_hashAnimCheckTimeout) {
          clearTimeout(_hashAnimCheckTimeout);
        }
      },
      // pid - Picture index
      // gid - Gallery index
      _parseItemIndexFromURL = function _parseItemIndexFromURL() {
        var hash = _getHash(),
          params = {};
        if (hash.length < 5) {
          // pid=1
          return params;
        }
        var i,
          vars = hash.split('&');
        for (i = 0; i < vars.length; i++) {
          if (!vars[i]) {
            continue;
          }
          var pair = vars[i].split('=');
          if (pair.length < 2) {
            continue;
          }
          params[pair[0]] = pair[1];
        }
        if (_options.galleryPIDs) {
          // detect custom pid in hash and search for it among the items collection
          var searchfor = params.pid;
          params.pid = 0; // if custom pid cannot be found, fallback to the first item
          for (i = 0; i < _items.length; i++) {
            if (_items[i].pid === searchfor) {
              params.pid = i;
              break;
            }
          }
        } else {
          params.pid = parseInt(params.pid, 10) - 1;
        }
        if (params.pid < 0) {
          params.pid = 0;
        }
        return params;
      },
      _updateHash2 = function _updateHash() {
        if (_hashAnimCheckTimeout) {
          clearTimeout(_hashAnimCheckTimeout);
        }
        if (_numAnimations || _isDragging) {
          // changing browser URL forces layout/paint in some browsers, which causes noticable lag during animation
          // that's why we update hash only when no animations running
          _hashAnimCheckTimeout = setTimeout(_updateHash2, 500);
          return;
        }
        if (_hashChangedByScript) {
          clearTimeout(_hashChangeTimeout);
        } else {
          _hashChangedByScript = true;
        }
        var pid = _currentItemIndex + 1;
        var item = _getItemAt(_currentItemIndex);
        if (item.hasOwnProperty('pid')) {
          // carry forward any custom pid assigned to the item
          pid = item.pid;
        }
        var newHash = _initialHash + '&' + 'gid=' + _options.galleryUID + '&' + 'pid=' + pid;
        if (!_historyChanged) {
          if (_windowLoc.hash.indexOf(newHash) === -1) {
            _urlChangedOnce = true;
          }
          // first time - add new hisory record, then just replace
        }
        var newURL = _windowLoc.href.split('#')[0] + '#' + newHash;
        if (_supportsPushState) {
          if ('#' + newHash !== window.location.hash) {
            history[_historyChanged ? 'replaceState' : 'pushState']('', document.title, newURL);
          }
        } else {
          if (_historyChanged) {
            _windowLoc.replace(newURL);
          } else {
            _windowLoc.hash = newHash;
          }
        }
        _historyChanged = true;
        _hashChangeTimeout = setTimeout(function () {
          _hashChangedByScript = false;
        }, 60);
      };
    _registerModule('History', {
      publicMethods: {
        initHistory: function initHistory() {
          framework.extend(_options, _historyDefaultOptions, true);
          if (!_options.history) {
            return;
          }
          _windowLoc = window.location;
          _urlChangedOnce = false;
          _closedFromURL = false;
          _historyChanged = false;
          _initialHash = _getHash();
          _supportsPushState = 'pushState' in history;
          if (_initialHash.indexOf('gid=') > -1) {
            _initialHash = _initialHash.split('&gid=')[0];
            _initialHash = _initialHash.split('?gid=')[0];
          }
          _listen('afterChange', self.updateURL);
          _listen('unbindEvents', function () {
            framework.unbind(window, 'hashchange', self.onHashChange);
          });
          var returnToOriginal = function returnToOriginal() {
            _hashReseted = true;
            if (!_closedFromURL) {
              if (_urlChangedOnce) {
                history.back();
              } else {
                if (_initialHash) {
                  _windowLoc.hash = _initialHash;
                } else {
                  if (_supportsPushState) {
                    // remove hash from url without refreshing it or scrolling to top
                    history.pushState('', document.title, _windowLoc.pathname + _windowLoc.search);
                  } else {
                    _windowLoc.hash = '';
                  }
                }
              }
            }
            _cleanHistoryTimeouts();
          };
          _listen('unbindEvents', function () {
            if (_closedByScroll) {
              // if PhotoSwipe is closed by scroll, we go "back" before the closing animation starts
              // this is done to keep the scroll position
              returnToOriginal();
            }
          });
          _listen('destroy', function () {
            if (!_hashReseted) {
              returnToOriginal();
            }
          });
          _listen('firstUpdate', function () {
            _currentItemIndex = _parseItemIndexFromURL().pid;
          });
          var index = _initialHash.indexOf('pid=');
          if (index > -1) {
            _initialHash = _initialHash.substring(0, index);
            if (_initialHash.slice(-1) === '&') {
              _initialHash = _initialHash.slice(0, -1);
            }
          }
          setTimeout(function () {
            if (_isOpen) {
              // hasn't destroyed yet
              framework.bind(window, 'hashchange', self.onHashChange);
            }
          }, 40);
        },
        onHashChange: function onHashChange() {
          if (_getHash() === _initialHash) {
            _closedFromURL = true;
            self.close();
            return;
          }
          if (!_hashChangedByScript) {
            _hashChangedByHistory = true;
            self.goTo(_parseItemIndexFromURL().pid);
            _hashChangedByHistory = false;
          }
        },
        updateURL: function updateURL() {
          // Delay the update of URL, to avoid lag during transition, 
          // and to not to trigger actions like "refresh page sound" or "blinking favicon" to often

          _cleanHistoryTimeouts();
          if (_hashChangedByHistory) {
            return;
          }
          if (!_historyChanged) {
            _updateHash2(); // first time
          } else {
            _historyUpdateTimeout = setTimeout(_updateHash2, 800);
          }
        }
      }
    });

    /*>>history*/
    framework.extend(self, publicMethods);
  };
  return PhotoSwipe;
});

},{}],4:[function(require,module,exports){
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/*!
Waypoints - 4.0.0
Copyright © 2011-2015 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blog/master/licenses.txt
*/
(function () {
  'use strict';

  var keyCounter = 0;
  var allWaypoints = {};

  /* http://imakewebthings.com/waypoints/api/waypoint */
  function Waypoint(options) {
    if (!options) {
      throw new Error('No options passed to Waypoint constructor');
    }
    if (!options.element) {
      throw new Error('No element option passed to Waypoint constructor');
    }
    if (!options.handler) {
      throw new Error('No handler option passed to Waypoint constructor');
    }
    this.key = 'waypoint-' + keyCounter;
    this.options = Waypoint.Adapter.extend({}, Waypoint.defaults, options);
    this.element = this.options.element;
    this.adapter = new Waypoint.Adapter(this.element);
    this.callback = options.handler;
    this.axis = this.options.horizontal ? 'horizontal' : 'vertical';
    this.enabled = this.options.enabled;
    this.triggerPoint = null;
    this.group = Waypoint.Group.findOrCreate({
      name: this.options.group,
      axis: this.axis
    });
    this.context = Waypoint.Context.findOrCreateByElement(this.options.context);
    if (Waypoint.offsetAliases[this.options.offset]) {
      this.options.offset = Waypoint.offsetAliases[this.options.offset];
    }
    this.group.add(this);
    this.context.add(this);
    allWaypoints[this.key] = this;
    keyCounter += 1;
  }

  /* Private */
  Waypoint.prototype.queueTrigger = function (direction) {
    this.group.queueTrigger(this, direction);
  };

  /* Private */
  Waypoint.prototype.trigger = function (args) {
    if (!this.enabled) {
      return;
    }
    if (this.callback) {
      this.callback.apply(this, args);
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/destroy */
  Waypoint.prototype.destroy = function () {
    this.context.remove(this);
    this.group.remove(this);
    delete allWaypoints[this.key];
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/disable */
  Waypoint.prototype.disable = function () {
    this.enabled = false;
    return this;
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/enable */
  Waypoint.prototype.enable = function () {
    this.context.refresh();
    this.enabled = true;
    return this;
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/next */
  Waypoint.prototype.next = function () {
    return this.group.next(this);
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/previous */
  Waypoint.prototype.previous = function () {
    return this.group.previous(this);
  };

  /* Private */
  Waypoint.invokeAll = function (method) {
    var allWaypointsArray = [];
    for (var waypointKey in allWaypoints) {
      allWaypointsArray.push(allWaypoints[waypointKey]);
    }
    for (var i = 0, end = allWaypointsArray.length; i < end; i++) {
      allWaypointsArray[i][method]();
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/destroy-all */
  Waypoint.destroyAll = function () {
    Waypoint.invokeAll('destroy');
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/disable-all */
  Waypoint.disableAll = function () {
    Waypoint.invokeAll('disable');
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/enable-all */
  Waypoint.enableAll = function () {
    Waypoint.invokeAll('enable');
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/refresh-all */
  Waypoint.refreshAll = function () {
    Waypoint.Context.refreshAll();
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/viewport-height */
  Waypoint.viewportHeight = function () {
    return window.innerHeight || document.documentElement.clientHeight;
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/viewport-width */
  Waypoint.viewportWidth = function () {
    return document.documentElement.clientWidth;
  };
  Waypoint.adapters = [];
  Waypoint.defaults = {
    context: window,
    continuous: true,
    enabled: true,
    group: 'default',
    horizontal: false,
    offset: 0
  };
  Waypoint.offsetAliases = {
    'bottom-in-view': function bottomInView() {
      return this.context.innerHeight() - this.adapter.outerHeight();
    },
    'right-in-view': function rightInView() {
      return this.context.innerWidth() - this.adapter.outerWidth();
    }
  };
  window.Waypoint = Waypoint;
})();
(function () {
  'use strict';

  function requestAnimationFrameShim(callback) {
    window.setTimeout(callback, 1000 / 60);
  }
  var keyCounter = 0;
  var contexts = {};
  var Waypoint = window.Waypoint;
  var oldWindowLoad = window.onload;

  /* http://imakewebthings.com/waypoints/api/context */
  function Context(element) {
    this.element = element;
    this.Adapter = Waypoint.Adapter;
    this.adapter = new this.Adapter(element);
    this.key = 'waypoint-context-' + keyCounter;
    this.didScroll = false;
    this.didResize = false;
    this.oldScroll = {
      x: this.adapter.scrollLeft(),
      y: this.adapter.scrollTop()
    };
    this.waypoints = {
      vertical: {},
      horizontal: {}
    };
    element.waypointContextKey = this.key;
    contexts[element.waypointContextKey] = this;
    keyCounter += 1;
    this.createThrottledScrollHandler();
    this.createThrottledResizeHandler();
  }

  /* Private */
  Context.prototype.add = function (waypoint) {
    var axis = waypoint.options.horizontal ? 'horizontal' : 'vertical';
    this.waypoints[axis][waypoint.key] = waypoint;
    this.refresh();
  };

  /* Private */
  Context.prototype.checkEmpty = function () {
    var horizontalEmpty = this.Adapter.isEmptyObject(this.waypoints.horizontal);
    var verticalEmpty = this.Adapter.isEmptyObject(this.waypoints.vertical);
    if (horizontalEmpty && verticalEmpty) {
      this.adapter.off('.waypoints');
      delete contexts[this.key];
    }
  };

  /* Private */
  Context.prototype.createThrottledResizeHandler = function () {
    var self = this;
    function resizeHandler() {
      self.handleResize();
      self.didResize = false;
    }
    this.adapter.on('resize.waypoints', function () {
      if (!self.didResize) {
        self.didResize = true;
        Waypoint.requestAnimationFrame(resizeHandler);
      }
    });
  };

  /* Private */
  Context.prototype.createThrottledScrollHandler = function () {
    var self = this;
    function scrollHandler() {
      self.handleScroll();
      self.didScroll = false;
    }
    this.adapter.on('scroll.waypoints', function () {
      if (!self.didScroll || Waypoint.isTouch) {
        self.didScroll = true;
        Waypoint.requestAnimationFrame(scrollHandler);
      }
    });
  };

  /* Private */
  Context.prototype.handleResize = function () {
    Waypoint.Context.refreshAll();
  };

  /* Private */
  Context.prototype.handleScroll = function () {
    var triggeredGroups = {};
    var axes = {
      horizontal: {
        newScroll: this.adapter.scrollLeft(),
        oldScroll: this.oldScroll.x,
        forward: 'right',
        backward: 'left'
      },
      vertical: {
        newScroll: this.adapter.scrollTop(),
        oldScroll: this.oldScroll.y,
        forward: 'down',
        backward: 'up'
      }
    };
    for (var axisKey in axes) {
      var axis = axes[axisKey];
      var isForward = axis.newScroll > axis.oldScroll;
      var direction = isForward ? axis.forward : axis.backward;
      for (var waypointKey in this.waypoints[axisKey]) {
        var waypoint = this.waypoints[axisKey][waypointKey];
        var wasBeforeTriggerPoint = axis.oldScroll < waypoint.triggerPoint;
        var nowAfterTriggerPoint = axis.newScroll >= waypoint.triggerPoint;
        var crossedForward = wasBeforeTriggerPoint && nowAfterTriggerPoint;
        var crossedBackward = !wasBeforeTriggerPoint && !nowAfterTriggerPoint;
        if (crossedForward || crossedBackward) {
          waypoint.queueTrigger(direction);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        }
      }
    }
    for (var groupKey in triggeredGroups) {
      triggeredGroups[groupKey].flushTriggers();
    }
    this.oldScroll = {
      x: axes.horizontal.newScroll,
      y: axes.vertical.newScroll
    };
  };

  /* Private */
  Context.prototype.innerHeight = function () {
    /*eslint-disable eqeqeq */
    if (this.element == this.element.window) {
      return Waypoint.viewportHeight();
    }
    /*eslint-enable eqeqeq */
    return this.adapter.innerHeight();
  };

  /* Private */
  Context.prototype.remove = function (waypoint) {
    delete this.waypoints[waypoint.axis][waypoint.key];
    this.checkEmpty();
  };

  /* Private */
  Context.prototype.innerWidth = function () {
    /*eslint-disable eqeqeq */
    if (this.element == this.element.window) {
      return Waypoint.viewportWidth();
    }
    /*eslint-enable eqeqeq */
    return this.adapter.innerWidth();
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-destroy */
  Context.prototype.destroy = function () {
    var allWaypoints = [];
    for (var axis in this.waypoints) {
      for (var waypointKey in this.waypoints[axis]) {
        allWaypoints.push(this.waypoints[axis][waypointKey]);
      }
    }
    for (var i = 0, end = allWaypoints.length; i < end; i++) {
      allWaypoints[i].destroy();
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-refresh */
  Context.prototype.refresh = function () {
    /*eslint-disable eqeqeq */
    var isWindow = this.element == this.element.window;
    /*eslint-enable eqeqeq */
    var contextOffset = isWindow ? undefined : this.adapter.offset();
    var triggeredGroups = {};
    var axes;
    this.handleScroll();
    axes = {
      horizontal: {
        contextOffset: isWindow ? 0 : contextOffset.left,
        contextScroll: isWindow ? 0 : this.oldScroll.x,
        contextDimension: this.innerWidth(),
        oldScroll: this.oldScroll.x,
        forward: 'right',
        backward: 'left',
        offsetProp: 'left'
      },
      vertical: {
        contextOffset: isWindow ? 0 : contextOffset.top,
        contextScroll: isWindow ? 0 : this.oldScroll.y,
        contextDimension: this.innerHeight(),
        oldScroll: this.oldScroll.y,
        forward: 'down',
        backward: 'up',
        offsetProp: 'top'
      }
    };
    for (var axisKey in axes) {
      var axis = axes[axisKey];
      for (var waypointKey in this.waypoints[axisKey]) {
        var waypoint = this.waypoints[axisKey][waypointKey];
        var adjustment = waypoint.options.offset;
        var oldTriggerPoint = waypoint.triggerPoint;
        var elementOffset = 0;
        var freshWaypoint = oldTriggerPoint == null;
        var contextModifier, wasBeforeScroll, nowAfterScroll;
        var triggeredBackward, triggeredForward;
        if (waypoint.element !== waypoint.element.window) {
          elementOffset = waypoint.adapter.offset()[axis.offsetProp];
        }
        if (typeof adjustment === 'function') {
          adjustment = adjustment.apply(waypoint);
        } else if (typeof adjustment === 'string') {
          adjustment = parseFloat(adjustment);
          if (waypoint.options.offset.indexOf('%') > -1) {
            adjustment = Math.ceil(axis.contextDimension * adjustment / 100);
          }
        }
        contextModifier = axis.contextScroll - axis.contextOffset;
        waypoint.triggerPoint = elementOffset + contextModifier - adjustment;
        wasBeforeScroll = oldTriggerPoint < axis.oldScroll;
        nowAfterScroll = waypoint.triggerPoint >= axis.oldScroll;
        triggeredBackward = wasBeforeScroll && nowAfterScroll;
        triggeredForward = !wasBeforeScroll && !nowAfterScroll;
        if (!freshWaypoint && triggeredBackward) {
          waypoint.queueTrigger(axis.backward);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        } else if (!freshWaypoint && triggeredForward) {
          waypoint.queueTrigger(axis.forward);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        } else if (freshWaypoint && axis.oldScroll >= waypoint.triggerPoint) {
          waypoint.queueTrigger(axis.forward);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        }
      }
    }
    Waypoint.requestAnimationFrame(function () {
      for (var groupKey in triggeredGroups) {
        triggeredGroups[groupKey].flushTriggers();
      }
    });
    return this;
  };

  /* Private */
  Context.findOrCreateByElement = function (element) {
    return Context.findByElement(element) || new Context(element);
  };

  /* Private */
  Context.refreshAll = function () {
    for (var contextId in contexts) {
      contexts[contextId].refresh();
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-find-by-element */
  Context.findByElement = function (element) {
    return contexts[element.waypointContextKey];
  };
  window.onload = function () {
    if (oldWindowLoad) {
      oldWindowLoad();
    }
    Context.refreshAll();
  };
  Waypoint.requestAnimationFrame = function (callback) {
    var requestFn = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || requestAnimationFrameShim;
    requestFn.call(window, callback);
  };
  Waypoint.Context = Context;
})();
(function () {
  'use strict';

  function byTriggerPoint(a, b) {
    return a.triggerPoint - b.triggerPoint;
  }
  function byReverseTriggerPoint(a, b) {
    return b.triggerPoint - a.triggerPoint;
  }
  var groups = {
    vertical: {},
    horizontal: {}
  };
  var Waypoint = window.Waypoint;

  /* http://imakewebthings.com/waypoints/api/group */
  function Group(options) {
    this.name = options.name;
    this.axis = options.axis;
    this.id = this.name + '-' + this.axis;
    this.waypoints = [];
    this.clearTriggerQueues();
    groups[this.axis][this.name] = this;
  }

  /* Private */
  Group.prototype.add = function (waypoint) {
    this.waypoints.push(waypoint);
  };

  /* Private */
  Group.prototype.clearTriggerQueues = function () {
    this.triggerQueues = {
      up: [],
      down: [],
      left: [],
      right: []
    };
  };

  /* Private */
  Group.prototype.flushTriggers = function () {
    for (var direction in this.triggerQueues) {
      var waypoints = this.triggerQueues[direction];
      var reverse = direction === 'up' || direction === 'left';
      waypoints.sort(reverse ? byReverseTriggerPoint : byTriggerPoint);
      for (var i = 0, end = waypoints.length; i < end; i += 1) {
        var waypoint = waypoints[i];
        if (waypoint.options.continuous || i === waypoints.length - 1) {
          waypoint.trigger([direction]);
        }
      }
    }
    this.clearTriggerQueues();
  };

  /* Private */
  Group.prototype.next = function (waypoint) {
    this.waypoints.sort(byTriggerPoint);
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints);
    var isLast = index === this.waypoints.length - 1;
    return isLast ? null : this.waypoints[index + 1];
  };

  /* Private */
  Group.prototype.previous = function (waypoint) {
    this.waypoints.sort(byTriggerPoint);
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints);
    return index ? this.waypoints[index - 1] : null;
  };

  /* Private */
  Group.prototype.queueTrigger = function (waypoint, direction) {
    this.triggerQueues[direction].push(waypoint);
  };

  /* Private */
  Group.prototype.remove = function (waypoint) {
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints);
    if (index > -1) {
      this.waypoints.splice(index, 1);
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/first */
  Group.prototype.first = function () {
    return this.waypoints[0];
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/last */
  Group.prototype.last = function () {
    return this.waypoints[this.waypoints.length - 1];
  };

  /* Private */
  Group.findOrCreate = function (options) {
    return groups[options.axis][options.name] || new Group(options);
  };
  Waypoint.Group = Group;
})();
(function () {
  'use strict';

  var Waypoint = window.Waypoint;
  function isWindow(element) {
    return element === element.window;
  }
  function getWindow(element) {
    if (isWindow(element)) {
      return element;
    }
    return element.defaultView;
  }
  function NoFrameworkAdapter(element) {
    this.element = element;
    this.handlers = {};
  }
  NoFrameworkAdapter.prototype.innerHeight = function () {
    var isWin = isWindow(this.element);
    return isWin ? this.element.innerHeight : this.element.clientHeight;
  };
  NoFrameworkAdapter.prototype.innerWidth = function () {
    var isWin = isWindow(this.element);
    return isWin ? this.element.innerWidth : this.element.clientWidth;
  };
  NoFrameworkAdapter.prototype.off = function (event, handler) {
    function removeListeners(element, listeners, handler) {
      for (var i = 0, end = listeners.length - 1; i < end; i++) {
        var listener = listeners[i];
        if (!handler || handler === listener) {
          element.removeEventListener(listener);
        }
      }
    }
    var eventParts = event.split('.');
    var eventType = eventParts[0];
    var namespace = eventParts[1];
    var element = this.element;
    if (namespace && this.handlers[namespace] && eventType) {
      removeListeners(element, this.handlers[namespace][eventType], handler);
      this.handlers[namespace][eventType] = [];
    } else if (eventType) {
      for (var ns in this.handlers) {
        removeListeners(element, this.handlers[ns][eventType] || [], handler);
        this.handlers[ns][eventType] = [];
      }
    } else if (namespace && this.handlers[namespace]) {
      for (var type in this.handlers[namespace]) {
        removeListeners(element, this.handlers[namespace][type], handler);
      }
      this.handlers[namespace] = {};
    }
  };

  /* Adapted from jQuery 1.x offset() */
  NoFrameworkAdapter.prototype.offset = function () {
    if (!this.element.ownerDocument) {
      return null;
    }
    var documentElement = this.element.ownerDocument.documentElement;
    var win = getWindow(this.element.ownerDocument);
    var rect = {
      top: 0,
      left: 0
    };
    if (this.element.getBoundingClientRect) {
      rect = this.element.getBoundingClientRect();
    }
    return {
      top: rect.top + win.pageYOffset - documentElement.clientTop,
      left: rect.left + win.pageXOffset - documentElement.clientLeft
    };
  };
  NoFrameworkAdapter.prototype.on = function (event, handler) {
    var eventParts = event.split('.');
    var eventType = eventParts[0];
    var namespace = eventParts[1] || '__default';
    var nsHandlers = this.handlers[namespace] = this.handlers[namespace] || {};
    var nsTypeList = nsHandlers[eventType] = nsHandlers[eventType] || [];
    nsTypeList.push(handler);
    this.element.addEventListener(eventType, handler);
  };
  NoFrameworkAdapter.prototype.outerHeight = function (includeMargin) {
    var height = this.innerHeight();
    var computedStyle;
    if (includeMargin && !isWindow(this.element)) {
      computedStyle = window.getComputedStyle(this.element);
      height += parseInt(computedStyle.marginTop, 10);
      height += parseInt(computedStyle.marginBottom, 10);
    }
    return height;
  };
  NoFrameworkAdapter.prototype.outerWidth = function (includeMargin) {
    var width = this.innerWidth();
    var computedStyle;
    if (includeMargin && !isWindow(this.element)) {
      computedStyle = window.getComputedStyle(this.element);
      width += parseInt(computedStyle.marginLeft, 10);
      width += parseInt(computedStyle.marginRight, 10);
    }
    return width;
  };
  NoFrameworkAdapter.prototype.scrollLeft = function () {
    var win = getWindow(this.element);
    return win ? win.pageXOffset : this.element.scrollLeft;
  };
  NoFrameworkAdapter.prototype.scrollTop = function () {
    var win = getWindow(this.element);
    return win ? win.pageYOffset : this.element.scrollTop;
  };
  NoFrameworkAdapter.extend = function () {
    var args = Array.prototype.slice.call(arguments);
    function merge(target, obj) {
      if (_typeof(target) === 'object' && _typeof(obj) === 'object') {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            target[key] = obj[key];
          }
        }
      }
      return target;
    }
    for (var i = 1, end = args.length; i < end; i++) {
      merge(args[0], args[i]);
    }
    return args[0];
  };
  NoFrameworkAdapter.inArray = function (element, array, i) {
    return array == null ? -1 : array.indexOf(element, i);
  };
  NoFrameworkAdapter.isEmptyObject = function (obj) {
    /* eslint no-unused-vars: 0 */
    for (var name in obj) {
      return false;
    }
    return true;
  };
  Waypoint.adapters.push({
    name: 'noframework',
    Adapter: NoFrameworkAdapter
  });
  Waypoint.Adapter = NoFrameworkAdapter;
})();
/*!
Waypoints Inview Shortcut - 4.0.0
Copyright © 2011-2015 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blob/master/licenses.txt
*/
(function () {
  'use strict';

  function noop() {}
  var Waypoint = window.Waypoint;

  /* http://imakewebthings.com/waypoints/shortcuts/inview */
  function Inview(options) {
    this.options = Waypoint.Adapter.extend({}, Inview.defaults, options);
    this.axis = this.options.horizontal ? 'horizontal' : 'vertical';
    this.waypoints = [];
    this.element = this.options.element;
    this.createWaypoints();
  }

  /* Private */
  Inview.prototype.createWaypoints = function () {
    var configs = {
      vertical: [{
        down: 'enter',
        up: 'exited',
        offset: '100%'
      }, {
        down: 'entered',
        up: 'exit',
        offset: 'bottom-in-view'
      }, {
        down: 'exit',
        up: 'entered',
        offset: 0
      }, {
        down: 'exited',
        up: 'enter',
        offset: function offset() {
          return -this.adapter.outerHeight();
        }
      }],
      horizontal: [{
        right: 'enter',
        left: 'exited',
        offset: '100%'
      }, {
        right: 'entered',
        left: 'exit',
        offset: 'right-in-view'
      }, {
        right: 'exit',
        left: 'entered',
        offset: 0
      }, {
        right: 'exited',
        left: 'enter',
        offset: function offset() {
          return -this.adapter.outerWidth();
        }
      }]
    };
    for (var i = 0, end = configs[this.axis].length; i < end; i++) {
      var config = configs[this.axis][i];
      this.createWaypoint(config);
    }
  };

  /* Private */
  Inview.prototype.createWaypoint = function (config) {
    var self = this;
    this.waypoints.push(new Waypoint({
      context: this.options.context,
      element: this.options.element,
      enabled: this.options.enabled,
      handler: function (config) {
        return function (direction) {
          self.options[config[direction]].call(self, direction);
        };
      }(config),
      offset: config.offset,
      horizontal: this.options.horizontal
    }));
  };

  /* Public */
  Inview.prototype.destroy = function () {
    for (var i = 0, end = this.waypoints.length; i < end; i++) {
      this.waypoints[i].destroy();
    }
    this.waypoints = [];
  };
  Inview.prototype.disable = function () {
    for (var i = 0, end = this.waypoints.length; i < end; i++) {
      this.waypoints[i].disable();
    }
  };
  Inview.prototype.enable = function () {
    for (var i = 0, end = this.waypoints.length; i < end; i++) {
      this.waypoints[i].enable();
    }
  };
  Inview.defaults = {
    context: window,
    enabled: true,
    enter: noop,
    entered: noop,
    exit: noop,
    exited: noop
  };
  Waypoint.Inview = Inview;
})();

},{}],5:[function(require,module,exports){
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/**
 * Zenscroll 3.0.1
 * https://github.com/zengabor/zenscroll/
 *
 * Copyright 2015–2016 Gabor Lenard
 *
 * This is free and unencumbered software released into the public domain.
 *
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 *
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * For more information, please refer to <http://unlicense.org>
 *
 */

/*jshint devel:true, asi:true */

/*global define, module */

(function (root, zenscroll) {
  if (typeof define === "function" && define.amd) {
    define([], zenscroll());
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && module.exports) {
    module.exports = zenscroll();
  } else {
    root.zenscroll = zenscroll();
  }
})(void 0, function () {
  "use strict";

  var createScroller = function createScroller(scrollContainer, defaultDuration, edgeOffset) {
    defaultDuration = defaultDuration || 999; //ms
    if (!edgeOffset || edgeOffset !== 0) {
      // When scrolling, this amount of distance is kept from the edges of the scrollContainer:
      edgeOffset = 9; //px
    }
    var scrollTimeoutId;
    var docElem = document.documentElement;

    // Detect if the browser already supports native smooth scrolling (e.g., Firefox 36+ and Chrome 49+) and it is enabled:
    var nativeSmoothScrollEnabled = function nativeSmoothScrollEnabled() {
      return "getComputedStyle" in window && window.getComputedStyle(scrollContainer ? scrollContainer : document.body)["scroll-behavior"] === "smooth";
    };
    var getScrollTop = function getScrollTop() {
      return scrollContainer ? scrollContainer.scrollTop : window.scrollY || docElem.scrollTop;
    };
    var getViewHeight = function getViewHeight() {
      return scrollContainer ? Math.min(scrollContainer.offsetHeight, window.innerHeight) : window.innerHeight || docElem.clientHeight;
    };
    var getRelativeTopOf = function getRelativeTopOf(elem) {
      if (scrollContainer) {
        return elem.offsetTop - scrollContainer.offsetTop;
      } else {
        return elem.getBoundingClientRect().top + getScrollTop() - docElem.offsetTop;
      }
    };

    /**
     * Immediately stops the current smooth scroll operation
     */
    var stopScroll = function stopScroll() {
      clearTimeout(scrollTimeoutId);
      scrollTimeoutId = 0;
    };

    /**
     * Scrolls to a specific vertical position in the document.
     *
     * @param {endY} The vertical position within the document.
     * @param {duration} Optionally the duration of the scroll operation.
     *        If 0 or not provided it is automatically calculated based on the
     *        distance and the default duration.
     */
    var scrollToY = function scrollToY(endY, duration) {
      stopScroll();
      if (nativeSmoothScrollEnabled()) {
        (scrollContainer || window).scrollTo(0, endY);
      } else {
        var startY = getScrollTop();
        var distance = Math.max(endY, 0) - startY;
        duration = duration || Math.min(Math.abs(distance), defaultDuration);
        var startTime = new Date().getTime();
        (function loopScroll() {
          scrollTimeoutId = setTimeout(function () {
            var p = Math.min((new Date().getTime() - startTime) / duration, 1); // percentage
            var y = Math.max(Math.floor(startY + distance * (p < 0.5 ? 2 * p * p : p * (4 - p * 2) - 1)), 0);
            if (scrollContainer) {
              scrollContainer.scrollTop = y;
            } else {
              window.scrollTo(0, y);
            }
            if (p < 1 && getViewHeight() + y < (scrollContainer || docElem).scrollHeight) {
              loopScroll();
            } else {
              setTimeout(stopScroll, 99); // with cooldown time
            }
          }, 9);
        })();
      }
    };

    /**
     * Scrolls to the top of a specific element.
     *
     * @param {elem} The element.
     * @param {duration} Optionally the duration of the scroll operation.
     *        A value of 0 is ignored.
     */
    var scrollToElem = function scrollToElem(elem, duration) {
      scrollToY(getRelativeTopOf(elem) - edgeOffset, duration);
    };

    /**
     * Scrolls an element into view if necessary.
     *
     * @param {elem} The element.
     * @param {duration} Optionally the duration of the scroll operation.
     *        A value of 0 is ignored.
     */
    var scrollIntoView = function scrollIntoView(elem, duration) {
      var elemScrollHeight = elem.getBoundingClientRect().height + 2 * edgeOffset;
      var vHeight = getViewHeight();
      var elemTop = getRelativeTopOf(elem);
      var elemBottom = elemTop + elemScrollHeight;
      var scrollTop = getScrollTop();
      if (elemTop - scrollTop < edgeOffset || elemScrollHeight > vHeight) {
        // Element is clipped at top or is higher than screen.
        scrollToElem(elem, duration);
      } else if (scrollTop + vHeight - elemBottom < edgeOffset) {
        // Element is clipped at the bottom.
        scrollToY(elemBottom - vHeight, duration);
      }
    };

    /**
     * Scrolls to the center of an element.
     *
     * @param {elem} The element.
     * @param {duration} Optionally the duration of the scroll operation.
     * @param {offset} Optionally the offset of the top of the element from the center of the screen.
     *        A value of 0 is ignored.
     */
    var scrollToCenterOf = function scrollToCenterOf(elem, duration, offset) {
      scrollToY(Math.max(getRelativeTopOf(elem) - getViewHeight() / 2 + (offset || elem.getBoundingClientRect().height / 2), 0), duration);
    };

    /**
     * Changes default settings for this scroller.
     *
     * @param {newDefaultDuration} New value for default duration, used for each scroll method by default.
     *        Ignored if 0 or falsy.
     * @param {newEdgeOffset} New value for the edge offset, used by each scroll method by default.
     */
    var setup = function setup(newDefaultDuration, newEdgeOffset) {
      if (newDefaultDuration) {
        defaultDuration = newDefaultDuration;
      }
      if (newEdgeOffset === 0 || newEdgeOffset) {
        edgeOffset = newEdgeOffset;
      }
    };
    return {
      setup: setup,
      to: scrollToElem,
      toY: scrollToY,
      intoView: scrollIntoView,
      center: scrollToCenterOf,
      stop: stopScroll,
      moving: function moving() {
        return !!scrollTimeoutId;
      }
    };
  };

  // Create a scroller for the browser window, omitting parameters:
  var defaultScroller = createScroller();

  // Create listeners for the documentElement only & exclude IE8-
  if ("addEventListener" in window && document.body.style.scrollBehavior !== "smooth" && !window.noZensmooth) {
    var replaceUrl = function replaceUrl(hash) {
      try {
        history.replaceState({}, "", window.location.href.split("#")[0] + hash);
      } catch (e) {
        // To avoid the Security exception in Chrome when the page was opened via the file protocol, e.g., file://index.html
      }
    };
    window.addEventListener("click", function (event) {
      var anchor = event.target;
      while (anchor && anchor.tagName !== "A") {
        anchor = anchor.parentNode;
      }
      if (!anchor || event.which !== 1 || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      var href = anchor.getAttribute("href") || "";
      if (href.indexOf("#") === 0) {
        if (href === "#") {
          event.preventDefault(); // Prevent the browser from handling the activation of the link
          defaultScroller.toY(0);
          replaceUrl("");
        } else {
          var targetId = anchor.hash.substring(1);
          var targetElem = document.getElementById(targetId);
          if (targetElem) {
            event.preventDefault(); // Prevent the browser from handling the activation of the link
            defaultScroller.to(targetElem);
            replaceUrl("#" + targetId);
          }
        }
      }
    }, false);
  }
  return {
    // Expose the "constructor" that can create a new scroller:
    createScroller: createScroller,
    // Surface the methods of the default scroller:
    setup: defaultScroller.setup,
    to: defaultScroller.to,
    toY: defaultScroller.toY,
    intoView: defaultScroller.intoView,
    center: defaultScroller.center,
    stop: defaultScroller.stop,
    moving: defaultScroller.moving
  };
});

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ImportCustomFont;
function ImportCustomFont() {
  var config = {
    kitId: 'qtq5qnh',
    scriptTimeout: 3000,
    async: true
  };
  var h = document.documentElement;
  var t = setTimeout(function () {
    h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
  }, config.scriptTimeout);
  var tk = document.createElement("script");
  var f = false;
  var s = document.getElementsByTagName("script")[0];
  var a;
  h.className += " wf-loading";
  tk.src = 'https://use.typekit.net/' + config.kitId + '.js';
  tk.async = true;
  tk.onload = tk.onreadystatechange = function () {
    a = this.readyState;
    if (f || a && a != "complete" && a != "loaded") return;
    f = true;
    clearTimeout(t);
    try {
      Typekit.load(config);
    } catch (e) {}
  };
  s.parentNode.insertBefore(tk, s);
}
;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = PrimaryNav;
function PrimaryNav() {
  // cache dom elements
  var body = document.body,
    navTrigger = document.querySelector(".js-nav-trigger"),
    container = document.querySelector(".container"),
    primaryNav = document.querySelector(".js-primary-nav"),
    primaryNavLinks = document.querySelectorAll(".js-primary-nav a");

  // Flag that JS has loaded
  body.classList.remove("no-js");
  body.classList.add("js");

  // Hamburger menu
  navTrigger.addEventListener("click", function () {
    // toggle active class on the nav trigger
    this.classList.toggle("open");
    // toggle the active class on site container
    container.classList.toggle("js-nav-active");
  });

  // In-menu link click
  for (var i = 0; i < primaryNavLinks.length; i++) {
    var primaryNavLink = primaryNavLinks[i];
    primaryNavLink.onclick = function () {
      // toggle active class on the nav trigger
      navTrigger.classList.toggle("open");
      // immediately hide the nav
      primaryNav.style.opacity = "0";
      // once drawer has had time to pull up, restore opacity
      setTimeout(function () {
        primaryNav.style.opacity = "1";
      }, 1000);
      // toggle the active class on site container
      container.classList.toggle("js-nav-active");
    };
  }
}
;

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = TimelineLoading;
function TimelineLoading() {
  var timelineBlocks = document.querySelectorAll(".cd-timeline-block, .cgd-timeline-block");
  Array.prototype.forEach.call(timelineBlocks, function (el, i) {
    var waypoint = new Waypoint({
      element: el,
      handler: function handler() {
        el.classList.add('fadeInUp');
      },
      offset: '75%'
    });
  });
}
;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJfanMtZXM2L2FwcC5qcyIsIl9qcy1lczYvbGlicy9waG90b3N3aXBlLXVpLWRlZmF1bHQuanMiLCJfanMtZXM2L2xpYnMvcGhvdG9zd2lwZS5qcyIsIl9qcy1lczYvbGlicy93YXlwb2ludHMuanMiLCJfanMtZXM2L2xpYnMvemVuc2Nyb2xsLmpzIiwiX2pzLWVzNi9tb2R1bGVzL2ltcG9ydC1jdXN0b20tZm9udC5qcyIsIl9qcy1lczYvbW9kdWxlcy9wcmltYXJ5LW5hdi5qcyIsIl9qcy1lczYvbW9kdWxlcy90aW1lbGluZS1sb2FkaW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNDQSxJQUFBLFVBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLFVBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLFdBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLG9CQUFBLEdBQUEsc0JBQUEsQ0FBQSxPQUFBO0FBR0EsSUFBQSxXQUFBLEdBQUEsc0JBQUEsQ0FBQSxPQUFBO0FBR0EsSUFBQSxnQkFBQSxHQUFBLHNCQUFBLENBQUEsT0FBQTtBQUdBLElBQUEsaUJBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFBNEQsU0FBQSx1QkFBQSxDQUFBLFdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxVQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBO0FBYjVEOztBQU1BOztBQUVBLElBQUEsc0JBQVUsRUFBQyxDQUFDO0FBR1osSUFBQSwyQkFBZSxFQUFDLENBQUM7QUFHakIsSUFBQSw0QkFBZ0IsRUFBQyxDQUFDOztBQUdsQjtBQUNFLElBQUkscUJBQXFCLEdBQUcsU0FBeEIscUJBQXFCLENBQVksZUFBZSxFQUFFO0VBRWxELElBQUksc0JBQXNCLEdBQUcsU0FBekIsc0JBQXNCLENBQVksRUFBRSxFQUFFO0lBQ3RDLElBQUksYUFBYSxHQUFHLEVB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QUF5QyxDQUFDO0VBRXpGLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBUyxFQUFFLEVBQUUsQ0FBQyxFQUFDO0lBRTFELElBQUksUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDO01BQzFCLE9BQU8sRUFBRSxFQUFFO01BQ1gsT0FBTyxFQUFFLFNBQVQsT0FBTyxDQUFBLEVBQWE7UUFDbEIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO01BQzlCLENBQUM7TUFDRCxNQUFNLEVBQUU7SUFDVixDQUFDLENBQUM7RUFFSixDQUFDLENBQUM7QUFDSjtBQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gbGlicmFyaWVzXHJcbmltcG9ydCBaZW5TY3JvbGwgZnJvbSAnLi9saWJzL3plbnNjcm9sbCc7XHJcbmltcG9ydCBXYXlQb2ludHMgZnJvbSAnLi9saWJzL3dheXBvaW50cyc7XHJcbmltcG9ydCBQaG90b1N3aXBlIGZyb20gJy4vbGlicy9waG90b3N3aXBlJztcclxuaW1wb3J0IFBob3RvU3dpcGVVSV9EZWZhdWx0IGZyb20gJy4vbGlicy9waG90b3N3aXBlLXVpLWRlZmF1bHQnO1xyXG5cclxuLy8gbW9kdWxlc1xyXG5pbXBvcnQgUHJpbWFyeU5hdiBmcm9tICcuL21vZHVsZXMvcHJpbWFyeS1uYXYnO1xyXG5QcmltYXJ5TmF2KCk7XHJcblxyXG5pbXBvcnQgVGltZWxpbmVMb2FkaW5nIGZyb20gJy4vbW9kdWxlcy90aW1lbGluZS1sb2FkaW5nJztcclxuVGltZWxpbmVMb2FkaW5nKCk7XHJcblxyXG5pbXBvcnQgSW1wb3J0Q3VzdG9tRm9udCBmcm9tIFwiLi9tb2R1bGVzL2ltcG9ydC1jdXN0b20tZm9udFwiO1xyXG5JbXBvcnRDdXN0b21Gb250KCk7XHJcblxyXG5cclxuLy8gUGhvdG9zd2lwZVxyXG4gIHZhciBpbml0UGhvdG9Td2lwZUZyb21ET00gPSBmdW5jdGlvbihnYWxsZXJ5U2VsZWN0b3IpIHtcclxuXHJcbiAgICAgIHZhciBwYXJzZVRodW1ibmFpbEVsZW1lbnRzID0gZnVuY3Rpb24oZWwpIHtcclxuICAgICAgICAgIHZhciB0aHVtYkVsZW1lbnRzID0gZWwuY2hpbGROb2RlcyxcclxuICAgICAgICAgICAgICBudW1Ob2RlcyA9IHRodW1iRWxlbWVudHMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgIGl0ZW1zID0gW10sXHJcbiAgICAgICAgICAgICAgZWwsXHJcbiAgICAgICAgICAgICAgY2hpbGRFbGVtZW50cyxcclxuICAgICAgICAgICAgICB0aHVtYm5haWxFbCxcclxuICAgICAgICAgICAgICBzaXplLFxyXG4gICAgICAgICAgICAgIGl0ZW07XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG51bU5vZGVzOyBpKyspIHtcclxuICAgICAgICAgICAgICBlbCA9IHRodW1iRWxlbWVudHNbaV07XHJcblxyXG4gICAgICAgICAgICAgIC8vIGluY2x1ZGUgb25seSBlbGVtZW50IG5vZGVzXHJcbiAgICAgICAgICAgICAgaWYoZWwubm9kZVR5cGUgIT09IDEpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY2hpbGRFbGVtZW50cyA9IGVsLmNoaWxkcmVuO1xyXG5cclxuICAgICAgICAgICAgICBzaXplID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXNpemUnKS5zcGxpdCgneCcpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBjcmVhdGUgc2xpZGUgb2JqZWN0XHJcbiAgICAgICAgICAgICAgaXRlbSA9IHtcclxuICAgICAgICAgICAgICAgICAgc3JjOiBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSxcclxuICAgICAgICAgICAgICAgICAgdzogcGFyc2VJbnQoc2l6ZVswXSwgMTApLFxyXG4gICAgICAgICAgICAgICAgICBoOiBwYXJzZUludChzaXplWzFdLCAxMCksXHJcbiAgICAgICAgICAgICAgICAgIGF1dGhvcjogZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWF1dGhvcicpXHJcbiAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgaXRlbS5lbCA9IGVsOyAvLyBzYXZlIGxpbmsgdG8gZWxlbWVudCBmb3IgZ2V0VGh1bWJCb3VuZHNGblxyXG5cclxuICAgICAgICAgICAgICBpZihjaGlsZEVsZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0ubXNyYyA9IGNoaWxkRWxlbWVudHNbMF0uZ2V0QXR0cmlidXRlKCdzcmMnKTsgLy8gdGh1bWJuYWlsIHVybFxyXG4gICAgICAgICAgICAgICAgaWYoY2hpbGRFbGVtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS50aXRsZSA9IGNoaWxkRWxlbWVudHNbMV0uaW5uZXJIVE1MOyAvLyBjYXB0aW9uIChjb250ZW50cyBvZiBmaWd1cmUpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgdmFyIG1lZGl1bVNyYyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1tZWQnKTtcclxuICAgICAgICAgICAgICAgIGlmKG1lZGl1bVNyYykge1xyXG4gICAgICAgICAgICAgICAgICBzaXplID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLW1lZC1zaXplJykuc3BsaXQoJ3gnKTtcclxuICAgICAgICAgICAgICAgICAgLy8gXCJtZWRpdW0tc2l6ZWRcIiBpbWFnZVxyXG4gICAgICAgICAgICAgICAgICBpdGVtLm0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogbWVkaXVtU3JjLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3OiBwYXJzZUludChzaXplWzBdLCAxMCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGg6IHBhcnNlSW50KHNpemVbMV0sIDEwKVxyXG4gICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gb3JpZ2luYWwgaW1hZ2VcclxuICAgICAgICAgICAgICAgIGl0ZW0ubyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzcmM6IGl0ZW0uc3JjLFxyXG4gICAgICAgICAgICAgICAgICAgIHc6IGl0ZW0udyxcclxuICAgICAgICAgICAgICAgICAgICBoOiBpdGVtLmhcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgIGl0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gZmluZCBuZWFyZXN0IHBhcmVudCBlbGVtZW50XHJcbiAgICAgIHZhciBjbG9zZXN0ID0gZnVuY3Rpb24gY2xvc2VzdChlbCwgZm4pIHtcclxuICAgICAgICAgIHJldHVybiBlbCAmJiAoIGZuKGVsKSA/IGVsIDogY2xvc2VzdChlbC5wYXJlbnROb2RlLCBmbikgKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBvblRodW1ibmFpbHNDbGljayA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIGRlYnVnZ2VyO1xyXG4gICAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA/IGUucHJldmVudERlZmF1bHQoKSA6IGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICB2YXIgZVRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuXHJcbiAgICAgICAgICB2YXIgY2xpY2tlZExpc3RJdGVtID0gY2xvc2VzdChlVGFyZ2V0LCBmdW5jdGlvbihlbCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBlbC50YWdOYW1lID09PSAnQSc7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBpZighY2xpY2tlZExpc3RJdGVtKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBjbGlja2VkR2FsbGVyeSA9IGNsaWNrZWRMaXN0SXRlbS5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICAgIHZhciBjaGlsZE5vZGVzID0gY2xpY2tlZExpc3RJdGVtLnBhcmVudE5vZGUuY2hpbGROb2RlcyxcclxuICAgICAgICAgICAgICBudW1DaGlsZE5vZGVzID0gY2hpbGROb2Rlcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgbm9kZUluZGV4ID0gMCxcclxuICAgICAgICAgICAgICBpbmRleDtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUNoaWxkTm9kZXM7IGkrKykge1xyXG4gICAgICAgICAgICAgIGlmKGNoaWxkTm9kZXNbaV0ubm9kZVR5cGUgIT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZihjaGlsZE5vZGVzW2ldID09PSBjbGlja2VkTGlzdEl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgaW5kZXggPSBub2RlSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBub2RlSW5kZXgrKztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZihpbmRleCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgb3BlblBob3RvU3dpcGUoIGluZGV4LCBjbGlja2VkR2FsbGVyeSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdmFyIHBob3Rvc3dpcGVQYXJzZUhhc2ggPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpLFxyXG4gICAgICAgICAgcGFyYW1zID0ge307XHJcblxyXG4gICAgICAgICAgaWYoaGFzaC5sZW5ndGggPCA1KSB7IC8vIHBpZD0xXHJcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtcztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgdmFycyA9IGhhc2guc3BsaXQoJyYnKTtcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgIGlmKCF2YXJzW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB2YXIgcGFpciA9IHZhcnNbaV0uc3BsaXQoJz0nKTtcclxuICAgICAgICAgICAgICBpZihwYWlyLmxlbmd0aCA8IDIpIHtcclxuICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHBhcmFtc1twYWlyWzBdXSA9IHBhaXJbMV07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYocGFyYW1zLmdpZCkge1xyXG4gICAgICAgICAgICAgIHBhcmFtcy5naWQgPSBwYXJzZUludChwYXJhbXMuZ2lkLCAxMCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHBhcmFtcztcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBvcGVuUGhvdG9Td2lwZSA9IGZ1bmN0aW9uKGluZGV4LCBnYWxsZXJ5RWxlbWVudCwgZGlzYWJsZUFuaW1hdGlvbiwgZnJvbVVSTCkge1xyXG4gICAgICAgICAgdmFyIHBzd3BFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBzd3AnKVswXSxcclxuICAgICAgICAgICAgICBnYWxsZXJ5LFxyXG4gICAgICAgICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgaXRlbXM7XHJcblxyXG4gICAgICAgICAgaXRlbXMgPSBwYXJzZVRodW1ibmFpbEVsZW1lbnRzKGdhbGxlcnlFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAvLyBkZWZpbmUgb3B0aW9ucyAoaWYgbmVlZGVkKVxyXG4gICAgICAgICAgb3B0aW9ucyA9IHtcclxuXHJcbiAgICAgICAgICAgICAgZ2FsbGVyeVVJRDogZ2FsbGVyeUVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXBzd3AtdWlkJyksXHJcblxyXG4gICAgICAgICAgICAgIGdldFRodW1iQm91bmRzRm46IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFNlZSBPcHRpb25zLT5nZXRUaHVtYkJvdW5kc0ZuIHNlY3Rpb24gb2YgZG9jcyBmb3IgbW9yZSBpbmZvXHJcbiAgICAgICAgICAgICAgICAgIHZhciB0aHVtYm5haWwgPSBpdGVtc1tpbmRleF0uZWwuY2hpbGRyZW5bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBwYWdlWVNjcm9sbCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcmVjdCA9IHRodW1ibmFpbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7eDpyZWN0LmxlZnQsIHk6cmVjdC50b3AgKyBwYWdlWVNjcm9sbCwgdzpyZWN0LndpZHRofTtcclxuICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICBhZGRDYXB0aW9uSFRNTEZuOiBmdW5jdGlvbihpdGVtLCBjYXB0aW9uRWwsIGlzRmFrZSkge1xyXG4gICAgICAgICAgICAgICAgICBpZighaXRlbS50aXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2FwdGlvbkVsLmNoaWxkcmVuWzBdLmlubmVyVGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGNhcHRpb25FbC5jaGlsZHJlblswXS5pbm5lckhUTUwgPSBpdGVtLnRpdGxlICsgICc8YnIvPjxzbWFsbD5QaG90bzogJyArIGl0ZW0uYXV0aG9yICsgJzwvc21hbGw+JztcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAgIGlmKGZyb21VUkwpIHtcclxuICAgICAgICAgICAgICBpZihvcHRpb25zLmdhbGxlcnlQSURzKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIHBhcnNlIHJlYWwgaW5kZXggd2hlbiBjdXN0b20gUElEcyBhcmUgdXNlZFxyXG4gICAgICAgICAgICAgICAgICAvLyBodHRwOi8vcGhvdG9zd2lwZS5jb20vZG9jdW1lbnRhdGlvbi9mYXEuaHRtbCNjdXN0b20tcGlkLWluLXVybFxyXG4gICAgICAgICAgICAgICAgICBmb3IodmFyIGogPSAwOyBqIDwgaXRlbXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGlmKGl0ZW1zW2pdLnBpZCA9PSBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuaW5kZXggPSBqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgb3B0aW9ucy5pbmRleCA9IHBhcnNlSW50KGluZGV4LCAxMCkgLSAxO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgb3B0aW9ucy5pbmRleCA9IHBhcnNlSW50KGluZGV4LCAxMCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gZXhpdCBpZiBpbmRleCBub3QgZm91bmRcclxuICAgICAgICAgIGlmKCBpc05hTihvcHRpb25zLmluZGV4KSApIHtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYoZGlzYWJsZUFuaW1hdGlvbikge1xyXG4gICAgICAgICAgICAgIG9wdGlvbnMuc2hvd0FuaW1hdGlvbkR1cmF0aW9uID0gMDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBQYXNzIGRhdGEgdG8gUGhvdG9Td2lwZSBhbmQgaW5pdGlhbGl6ZSBpdFxyXG4gICAgICAgICAgZ2FsbGVyeSA9IG5ldyBQaG90b1N3aXBlKCBwc3dwRWxlbWVudCwgUGhvdG9Td2lwZVVJX0RlZmF1bHQsIGl0ZW1zLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAvLyBzZWU6IGh0dHA6Ly9waG90b3N3aXBlLmNvbS9kb2N1bWVudGF0aW9uL3Jlc3BvbnNpdmUtaW1hZ2VzLmh0bWxcclxuICAgICAgICAgIHZhciByZWFsVmlld3BvcnRXaWR0aCxcclxuICAgICAgICAgICAgICB1c2VMYXJnZUltYWdlcyA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgIGZpcnN0UmVzaXplID0gdHJ1ZSxcclxuICAgICAgICAgICAgICBpbWFnZVNyY1dpbGxDaGFuZ2U7XHJcblxyXG4gICAgICAgICAgZ2FsbGVyeS5saXN0ZW4oJ2JlZm9yZVJlc2l6ZScsIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgICB2YXIgZHBpUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA/IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIDogMTtcclxuICAgICAgICAgICAgICBkcGlSYXRpbyA9IE1hdGgubWluKGRwaVJhdGlvLCAyLjUpO1xyXG4gICAgICAgICAgICAgIHJlYWxWaWV3cG9ydFdpZHRoID0gZ2FsbGVyeS52aWV3cG9ydFNpemUueCAqIGRwaVJhdGlvO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgaWYocmVhbFZpZXdwb3J0V2lkdGggPj0gMTIwMCB8fCAoIWdhbGxlcnkubGlrZWx5VG91Y2hEZXZpY2UgJiYgcmVhbFZpZXdwb3J0V2lkdGggPiA4MDApIHx8IHNjcmVlbi53aWR0aCA+IDEyMDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmKCF1c2VMYXJnZUltYWdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdXNlTGFyZ2VJbWFnZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaW1hZ2VTcmNXaWxsQ2hhbmdlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBpZih1c2VMYXJnZUltYWdlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdXNlTGFyZ2VJbWFnZXMgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgIGltYWdlU3JjV2lsbENoYW5nZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmKGltYWdlU3JjV2lsbENoYW5nZSAmJiAhZmlyc3RSZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgZ2FsbGVyeS5pbnZhbGlkYXRlQ3Vyckl0ZW1zKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZihmaXJzdFJlc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICBmaXJzdFJlc2l6ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaW1hZ2VTcmNXaWxsQ2hhbmdlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgZ2FsbGVyeS5saXN0ZW4oJ2dldHRpbmdEYXRhJywgZnVuY3Rpb24oaW5kZXgsIGl0ZW0pIHtcclxuICAgICAgICAgICAgICBpZiggdXNlTGFyZ2VJbWFnZXMgKSB7XHJcbiAgICAgICAgICAgICAgICAgIGl0ZW0uc3JjID0gaXRlbS5vLnNyYztcclxuICAgICAgICAgICAgICAgICAgaXRlbS53ID0gaXRlbS5vLnc7XHJcbiAgICAgICAgICAgICAgICAgIGl0ZW0uaCA9IGl0ZW0uby5oO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGl0ZW0uc3JjID0gaXRlbS5tLnNyYztcclxuICAgICAgICAgICAgICAgICAgaXRlbS53ID0gaXRlbS5tLnc7XHJcbiAgICAgICAgICAgICAgICAgIGl0ZW0uaCA9IGl0ZW0ubS5oO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGdhbGxlcnkuaW5pdCgpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gc2VsZWN0IGFsbCBnYWxsZXJ5IGVsZW1lbnRzXHJcbiAgICAgIHZhciBnYWxsZXJ5RWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBnYWxsZXJ5U2VsZWN0b3IgKTtcclxuICAgICAgZm9yKHZhciBpID0gMCwgbCA9IGdhbGxlcnlFbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgIGdhbGxlcnlFbGVtZW50c1tpXS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHN3cC11aWQnLCBpKzEpO1xyXG4gICAgICAgICAgZ2FsbGVyeUVsZW1lbnRzW2ldLm9uY2xpY2sgPSBvblRodW1ibmFpbHNDbGljaztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUGFyc2UgVVJMIGFuZCBvcGVuIGdhbGxlcnkgaWYgaXQgY29udGFpbnMgIyZwaWQ9MyZnaWQ9MVxyXG4gICAgICB2YXIgaGFzaERhdGEgPSBwaG90b3N3aXBlUGFyc2VIYXNoKCk7XHJcbiAgICAgIGlmKGhhc2hEYXRhLnBpZCAmJiBoYXNoRGF0YS5naWQpIHtcclxuICAgICAgICAgIG9wZW5QaG90b1N3aXBlKCBoYXNoRGF0YS5waWQsICBnYWxsZXJ5RWxlbWVudHNbIGhhc2hEYXRhLmdpZCAtIDEgXSwgdHJ1ZSwgdHJ1ZSApO1xyXG4gICAgICB9XHJcbiAgfTtcclxuXHJcbiAgaW5pdFBob3RvU3dpcGVGcm9tRE9NKCcuZ2FsbGVyeScpO1xyXG4iLCIvKiEgUGhvdG9Td2lwZSBEZWZhdWx0IFVJIC0gNC4xLjEgLSAyMDE1LTEyLTI0XHJcbiogaHR0cDovL3Bob3Rvc3dpcGUuY29tXHJcbiogQ29weXJpZ2h0IChjKSAyMDE1IERtaXRyeSBTZW1lbm92OyAqL1xyXG4vKipcclxuKlxyXG4qIFVJIG9uIHRvcCBvZiBtYWluIHNsaWRpbmcgYXJlYSAoY2FwdGlvbiwgYXJyb3dzLCBjbG9zZSBidXR0b24sIGV0Yy4pLlxyXG4qIEJ1aWx0IGp1c3QgdXNpbmcgcHVibGljIG1ldGhvZHMvcHJvcGVydGllcyBvZiBQaG90b1N3aXBlLlxyXG4qXHJcbiovXHJcbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZShmYWN0b3J5KTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJvb3QuUGhvdG9Td2lwZVVJX0RlZmF1bHQgPSBmYWN0b3J5KCk7XHJcbiAgfVxyXG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcblxyXG5cclxudmFyIFBob3RvU3dpcGVVSV9EZWZhdWx0ID1cclxuIGZ1bmN0aW9uKHBzd3AsIGZyYW1ld29yaykge1xyXG5cclxuICB2YXIgdWkgPSB0aGlzO1xyXG4gIHZhciBfb3ZlcmxheVVJVXBkYXRlZCA9IGZhbHNlLFxyXG4gICAgX2NvbnRyb2xzVmlzaWJsZSA9IHRydWUsXHJcbiAgICBfZnVsbHNjcmVuQVBJLFxyXG4gICAgX2NvbnRyb2xzLFxyXG4gICAgX2NhcHRpb25Db250YWluZXIsXHJcbiAgICBfZmFrZUNhcHRpb25Db250YWluZXIsXHJcbiAgICBfaW5kZXhJbmRpY2F0b3IsXHJcbiAgICBfc2hhcmVCdXR0b24sXHJcbiAgICBfc2hhcmVNb2RhbCxcclxuICAgIF9zaGFyZU1vZGFsSGlkZGVuID0gdHJ1ZSxcclxuICAgIF9pbml0YWxDbG9zZU9uU2Nyb2xsVmFsdWUsXHJcbiAgICBfaXNJZGxlLFxyXG4gICAgX2xpc3RlbixcclxuXHJcbiAgICBfbG9hZGluZ0luZGljYXRvcixcclxuICAgIF9sb2FkaW5nSW5kaWNhdG9ySGlkZGVuLFxyXG4gICAgX2xvYWRpbmdJbmRpY2F0b3JUaW1lb3V0LFxyXG5cclxuICAgIF9nYWxsZXJ5SGFzT25lU2xpZGUsXHJcblxyXG4gICAgX29wdGlvbnMsXHJcbiAgICBfZGVmYXVsdFVJT3B0aW9ucyA9IHtcclxuICAgICAgYmFyc1NpemU6IHt0b3A6NDQsIGJvdHRvbTonYXV0byd9LFxyXG4gICAgICBjbG9zZUVsQ2xhc3NlczogWydpdGVtJywgJ2NhcHRpb24nLCAnem9vbS13cmFwJywgJ3VpJywgJ3RvcC1iYXInXSxcclxuICAgICAgdGltZVRvSWRsZTogNDAwMCxcclxuICAgICAgdGltZVRvSWRsZU91dHNpZGU6IDEwMDAsXHJcbiAgICAgIGxvYWRpbmdJbmRpY2F0b3JEZWxheTogMTAwMCwgLy8gMnNcclxuXHJcbiAgICAgIGFkZENhcHRpb25IVE1MRm46IGZ1bmN0aW9uKGl0ZW0sIGNhcHRpb25FbCAvKiwgaXNGYWtlICovKSB7XHJcbiAgICAgICAgaWYoIWl0ZW0udGl0bGUpIHtcclxuICAgICAgICAgIGNhcHRpb25FbC5jaGlsZHJlblswXS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FwdGlvbkVsLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9IGl0ZW0udGl0bGU7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBjbG9zZUVsOnRydWUsXHJcbiAgICAgIGNhcHRpb25FbDogdHJ1ZSxcclxuICAgICAgZnVsbHNjcmVlbkVsOiB0cnVlLFxyXG4gICAgICB6b29tRWw6IHRydWUsXHJcbiAgICAgIHNoYXJlRWw6IHRydWUsXHJcbiAgICAgIGNvdW50ZXJFbDogdHJ1ZSxcclxuICAgICAgYXJyb3dFbDogdHJ1ZSxcclxuICAgICAgcHJlbG9hZGVyRWw6IHRydWUsXHJcblxyXG4gICAgICB0YXBUb0Nsb3NlOiBmYWxzZSxcclxuICAgICAgdGFwVG9Ub2dnbGVDb250cm9sczogdHJ1ZSxcclxuXHJcbiAgICAgIGNsaWNrVG9DbG9zZU5vblpvb21hYmxlOiB0cnVlLFxyXG5cclxuICAgICAgc2hhcmVCdXR0b25zOiBbXHJcbiAgICAgICAge2lkOidmYWNlYm9vaycsIGxhYmVsOidTaGFyZSBvbiBGYWNlYm9vaycsIHVybDonaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci9zaGFyZXIucGhwP3U9e3t1cmx9fSd9LFxyXG4gICAgICAgIHtpZDondHdpdHRlcicsIGxhYmVsOidUd2VldCcsIHVybDonaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/dGV4dD17e3RleHR9fSZ1cmw9e3t1cmx9fSd9LFxyXG4gICAgICAgIHtpZDonZG93bmxvYWQnLCBsYWJlbDonRG93bmxvYWQgaW1hZ2UnLCB1cmw6J3t7cmF3X2ltYWdlX3VybH19JywgZG93bmxvYWQ6dHJ1ZX1cclxuICAgICAgXSxcclxuICAgICAgZ2V0SW1hZ2VVUkxGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcclxuICAgICAgICByZXR1cm4gcHN3cC5jdXJySXRlbS5zcmMgfHwgJyc7XHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFBhZ2VVUkxGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcclxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgICAgIH0sXHJcbiAgICAgIGdldFRleHRGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcclxuICAgICAgICByZXR1cm4gcHN3cC5jdXJySXRlbS50aXRsZSB8fCAnJztcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGluZGV4SW5kaWNhdG9yU2VwOiAnIC8gJyxcclxuICAgICAgZml0Q29udHJvbHNXaWR0aDogMTIwMFxyXG5cclxuICAgIH0sXHJcbiAgICBfYmxvY2tDb250cm9sc1RhcCxcclxuICAgIF9ibG9ja0NvbnRyb2xzVGFwVGltZW91dDtcclxuXHJcblxyXG5cclxuICB2YXIgX29uQ29udHJvbHNUYXAgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGlmKF9ibG9ja0NvbnRyb2xzVGFwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuXHJcblxyXG4gICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XHJcblxyXG4gICAgICBpZihfb3B0aW9ucy50aW1lVG9JZGxlICYmIF9vcHRpb25zLm1vdXNlVXNlZCAmJiAhX2lzSWRsZSkge1xyXG4gICAgICAgIC8vIHJlc2V0IGlkbGUgdGltZXJcclxuICAgICAgICBfb25JZGxlTW91c2VNb3ZlKCk7XHJcbiAgICAgIH1cclxuXHJcblxyXG4gICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50LFxyXG4gICAgICAgIHVpRWxlbWVudCxcclxuICAgICAgICBjbGlja2VkQ2xhc3MgPSB0YXJnZXQuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8ICcnLFxyXG4gICAgICAgIGZvdW5kO1xyXG5cclxuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IF91aUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdWlFbGVtZW50ID0gX3VpRWxlbWVudHNbaV07XHJcbiAgICAgICAgaWYodWlFbGVtZW50Lm9uVGFwICYmIGNsaWNrZWRDbGFzcy5pbmRleE9mKCdwc3dwX18nICsgdWlFbGVtZW50Lm5hbWUgKSA+IC0xICkge1xyXG4gICAgICAgICAgdWlFbGVtZW50Lm9uVGFwKCk7XHJcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoZm91bmQpIHtcclxuICAgICAgICBpZihlLnN0b3BQcm9wYWdhdGlvbikge1xyXG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgX2Jsb2NrQ29udHJvbHNUYXAgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEFuZHJvaWQgZG9uJ3QgcHJldmVudCBnaG9zdCBjbGljayBldmVudFxyXG4gICAgICAgIC8vIHdoZW4gcHJldmVudERlZmF1bHQoKSB3YXMgY2FsbGVkIG9uIHRvdWNoc3RhcnQgYW5kL29yIHRvdWNoZW5kLlxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gVGhpcyBoYXBwZW5zIG9uIHY0LjMsIDQuMiwgNC4xLFxyXG4gICAgICAgIC8vIG9sZGVyIHZlcnNpb25zIHN0cmFuZ2VseSB3b3JrIGNvcnJlY3RseSxcclxuICAgICAgICAvLyBidXQganVzdCBpbiBjYXNlIHdlIGFkZCBkZWxheSBvbiBhbGwgb2YgdGhlbSlcclxuICAgICAgICB2YXIgdGFwRGVsYXkgPSBmcmFtZXdvcmsuZmVhdHVyZXMuaXNPbGRBbmRyb2lkID8gNjAwIDogMzA7XHJcbiAgICAgICAgX2Jsb2NrQ29udHJvbHNUYXBUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIF9ibG9ja0NvbnRyb2xzVGFwID0gZmFsc2U7XHJcbiAgICAgICAgfSwgdGFwRGVsYXkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuICAgIF9maXRDb250cm9sc0luVmlld3BvcnQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuICFwc3dwLmxpa2VseVRvdWNoRGV2aWNlIHx8IF9vcHRpb25zLm1vdXNlVXNlZCB8fCBzY3JlZW4ud2lkdGggPiBfb3B0aW9ucy5maXRDb250cm9sc1dpZHRoO1xyXG4gICAgfSxcclxuICAgIF90b2dnbGVQc3dwQ2xhc3MgPSBmdW5jdGlvbihlbCwgY05hbWUsIGFkZCkge1xyXG4gICAgICBmcmFtZXdvcmtbIChhZGQgPyAnYWRkJyA6ICdyZW1vdmUnKSArICdDbGFzcycgXShlbCwgJ3Bzd3BfXycgKyBjTmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIGFkZCBjbGFzcyB3aGVuIHRoZXJlIGlzIGp1c3Qgb25lIGl0ZW0gaW4gdGhlIGdhbGxlcnlcclxuICAgIC8vIChieSBkZWZhdWx0IGl0IGhpZGVzIGxlZnQvcmlnaHQgYXJyb3dzIGFuZCAxb2ZYIGNvdW50ZXIpXHJcbiAgICBfY291bnROdW1JdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaGFzT25lU2xpZGUgPSAoX29wdGlvbnMuZ2V0TnVtSXRlbXNGbigpID09PSAxKTtcclxuXHJcbiAgICAgIGlmKGhhc09uZVNsaWRlICE9PSBfZ2FsbGVyeUhhc09uZVNsaWRlKSB7XHJcbiAgICAgICAgX3RvZ2dsZVBzd3BDbGFzcyhfY29udHJvbHMsICd1aS0tb25lLXNsaWRlJywgaGFzT25lU2xpZGUpO1xyXG4gICAgICAgIF9nYWxsZXJ5SGFzT25lU2xpZGUgPSBoYXNPbmVTbGlkZTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF90b2dnbGVTaGFyZU1vZGFsQ2xhc3MgPSBmdW5jdGlvbigpIHtcclxuICAgICAgX3RvZ2dsZVBzd3BDbGFzcyhfc2hhcmVNb2RhbCwgJ3NoYXJlLW1vZGFsLS1oaWRkZW4nLCBfc2hhcmVNb2RhbEhpZGRlbik7XHJcbiAgICB9LFxyXG4gICAgX3RvZ2dsZVNoYXJlTW9kYWwgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIF9zaGFyZU1vZGFsSGlkZGVuID0gIV9zaGFyZU1vZGFsSGlkZGVuO1xyXG5cclxuXHJcbiAgICAgIGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xyXG4gICAgICAgIF90b2dnbGVTaGFyZU1vZGFsQ2xhc3MoKTtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYoIV9zaGFyZU1vZGFsSGlkZGVuKSB7XHJcbiAgICAgICAgICAgIGZyYW1ld29yay5hZGRDbGFzcyhfc2hhcmVNb2RhbCwgJ3Bzd3BfX3NoYXJlLW1vZGFsLS1mYWRlLWluJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMzApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhfc2hhcmVNb2RhbCwgJ3Bzd3BfX3NoYXJlLW1vZGFsLS1mYWRlLWluJyk7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmKF9zaGFyZU1vZGFsSGlkZGVuKSB7XHJcbiAgICAgICAgICAgIF90b2dnbGVTaGFyZU1vZGFsQ2xhc3MoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCAzMDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZighX3NoYXJlTW9kYWxIaWRkZW4pIHtcclxuICAgICAgICBfdXBkYXRlU2hhcmVVUkxzKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb3BlbldpbmRvd1BvcHVwID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XHJcbiAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XHJcblxyXG4gICAgICBwc3dwLnNob3V0KCdzaGFyZUxpbmtDbGljaycsIGUsIHRhcmdldCk7XHJcblxyXG4gICAgICBpZighdGFyZ2V0LmhyZWYpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKCB0YXJnZXQuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpICkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB3aW5kb3cub3Blbih0YXJnZXQuaHJlZiwgJ3Bzd3Bfc2hhcmUnLCAnc2Nyb2xsYmFycz15ZXMscmVzaXphYmxlPXllcyx0b29sYmFyPW5vLCcrXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xvY2F0aW9uPXllcyx3aWR0aD01NTAsaGVpZ2h0PTQyMCx0b3A9MTAwLGxlZnQ9JyArXHJcbiAgICAgICAgICAgICAgICAgICAgKHdpbmRvdy5zY3JlZW4gPyBNYXRoLnJvdW5kKHNjcmVlbi53aWR0aCAvIDIgLSAyNzUpIDogMTAwKSAgKTtcclxuXHJcbiAgICAgIGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xyXG4gICAgICAgIF90b2dnbGVTaGFyZU1vZGFsKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBfdXBkYXRlU2hhcmVVUkxzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzaGFyZUJ1dHRvbk91dCA9ICcnLFxyXG4gICAgICAgIHNoYXJlQnV0dG9uRGF0YSxcclxuICAgICAgICBzaGFyZVVSTCxcclxuICAgICAgICBpbWFnZV91cmwsXHJcbiAgICAgICAgcGFnZV91cmwsXHJcbiAgICAgICAgc2hhcmVfdGV4dDtcclxuXHJcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBfb3B0aW9ucy5zaGFyZUJ1dHRvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBzaGFyZUJ1dHRvbkRhdGEgPSBfb3B0aW9ucy5zaGFyZUJ1dHRvbnNbaV07XHJcblxyXG4gICAgICAgIGltYWdlX3VybCA9IF9vcHRpb25zLmdldEltYWdlVVJMRm9yU2hhcmUoc2hhcmVCdXR0b25EYXRhKTtcclxuICAgICAgICBwYWdlX3VybCA9IF9vcHRpb25zLmdldFBhZ2VVUkxGb3JTaGFyZShzaGFyZUJ1dHRvbkRhdGEpO1xyXG4gICAgICAgIHNoYXJlX3RleHQgPSBfb3B0aW9ucy5nZXRUZXh0Rm9yU2hhcmUoc2hhcmVCdXR0b25EYXRhKTtcclxuXHJcbiAgICAgICAgc2hhcmVVUkwgPSBzaGFyZUJ1dHRvbkRhdGEudXJsLnJlcGxhY2UoJ3t7dXJsfX0nLCBlbmNvZGVVUklDb21wb25lbnQocGFnZV91cmwpIClcclxuICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoJ3t7aW1hZ2VfdXJsfX0nLCBlbmNvZGVVUklDb21wb25lbnQoaW1hZ2VfdXJsKSApXHJcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCd7e3Jhd19pbWFnZV91cmx9fScsIGltYWdlX3VybCApXHJcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCd7e3RleHR9fScsIGVuY29kZVVSSUNvbXBvbmVudChzaGFyZV90ZXh0KSApO1xyXG5cclxuICAgICAgICBzaGFyZUJ1dHRvbk91dCArPSAnPGEgaHJlZj1cIicgKyBzaGFyZVVSTCArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIiAnK1xyXG4gICAgICAgICAgICAgICAgICAnY2xhc3M9XCJwc3dwX19zaGFyZS0tJyArIHNoYXJlQnV0dG9uRGF0YS5pZCArICdcIicgK1xyXG4gICAgICAgICAgICAgICAgICAoc2hhcmVCdXR0b25EYXRhLmRvd25sb2FkID8gJ2Rvd25sb2FkJyA6ICcnKSArICc+JyArXHJcbiAgICAgICAgICAgICAgICAgIHNoYXJlQnV0dG9uRGF0YS5sYWJlbCArICc8L2E+JztcclxuXHJcbiAgICAgICAgaWYoX29wdGlvbnMucGFyc2VTaGFyZUJ1dHRvbk91dCkge1xyXG4gICAgICAgICAgc2hhcmVCdXR0b25PdXQgPSBfb3B0aW9ucy5wYXJzZVNoYXJlQnV0dG9uT3V0KHNoYXJlQnV0dG9uRGF0YSwgc2hhcmVCdXR0b25PdXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBfc2hhcmVNb2RhbC5jaGlsZHJlblswXS5pbm5lckhUTUwgPSBzaGFyZUJ1dHRvbk91dDtcclxuICAgICAgX3NoYXJlTW9kYWwuY2hpbGRyZW5bMF0ub25jbGljayA9IF9vcGVuV2luZG93UG9wdXA7XHJcblxyXG4gICAgfSxcclxuICAgIF9oYXNDbG9zZUNsYXNzID0gZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgIGZvcih2YXIgIGkgPSAwOyBpIDwgX29wdGlvbnMuY2xvc2VFbENsYXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiggZnJhbWV3b3JrLmhhc0NsYXNzKHRhcmdldCwgJ3Bzd3BfXycgKyBfb3B0aW9ucy5jbG9zZUVsQ2xhc3Nlc1tpXSkgKSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBfaWRsZUludGVydmFsLFxyXG4gICAgX2lkbGVUaW1lcixcclxuICAgIF9pZGxlSW5jcmVtZW50ID0gMCxcclxuICAgIF9vbklkbGVNb3VzZU1vdmUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgY2xlYXJUaW1lb3V0KF9pZGxlVGltZXIpO1xyXG4gICAgICBfaWRsZUluY3JlbWVudCA9IDA7XHJcbiAgICAgIGlmKF9pc0lkbGUpIHtcclxuICAgICAgICB1aS5zZXRJZGxlKGZhbHNlKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9vbk1vdXNlTGVhdmVXaW5kb3cgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgIGUgPSBlID8gZSA6IHdpbmRvdy5ldmVudDtcclxuICAgICAgdmFyIGZyb20gPSBlLnJlbGF0ZWRUYXJnZXQgfHwgZS50b0VsZW1lbnQ7XHJcbiAgICAgIGlmICghZnJvbSB8fCBmcm9tLm5vZGVOYW1lID09PSAnSFRNTCcpIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQoX2lkbGVUaW1lcik7XHJcbiAgICAgICAgX2lkbGVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICB1aS5zZXRJZGxlKHRydWUpO1xyXG4gICAgICAgIH0sIF9vcHRpb25zLnRpbWVUb0lkbGVPdXRzaWRlKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXR1cEZ1bGxzY3JlZW5BUEkgPSBmdW5jdGlvbigpIHtcclxuICAgICAgaWYoX29wdGlvbnMuZnVsbHNjcmVlbkVsICYmICFmcmFtZXdvcmsuZmVhdHVyZXMuaXNPbGRBbmRyb2lkKSB7XHJcbiAgICAgICAgaWYoIV9mdWxsc2NyZW5BUEkpIHtcclxuICAgICAgICAgIF9mdWxsc2NyZW5BUEkgPSB1aS5nZXRGdWxsc2NyZWVuQVBJKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKF9mdWxsc2NyZW5BUEkpIHtcclxuICAgICAgICAgIGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCBfZnVsbHNjcmVuQVBJLmV2ZW50SywgdWkudXBkYXRlRnVsbHNjcmVlbik7XHJcbiAgICAgICAgICB1aS51cGRhdGVGdWxsc2NyZWVuKCk7XHJcbiAgICAgICAgICBmcmFtZXdvcmsuYWRkQ2xhc3MocHN3cC50ZW1wbGF0ZSwgJ3Bzd3AtLXN1cHBvcnRzLWZzJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhwc3dwLnRlbXBsYXRlLCAncHN3cC0tc3VwcG9ydHMtZnMnKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBfc2V0dXBMb2FkaW5nSW5kaWNhdG9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIFNldHVwIGxvYWRpbmcgaW5kaWNhdG9yXHJcbiAgICAgIGlmKF9vcHRpb25zLnByZWxvYWRlckVsKSB7XHJcblxyXG4gICAgICAgIF90b2dnbGVMb2FkaW5nSW5kaWNhdG9yKHRydWUpO1xyXG5cclxuICAgICAgICBfbGlzdGVuKCdiZWZvcmVDaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgICBjbGVhclRpbWVvdXQoX2xvYWRpbmdJbmRpY2F0b3JUaW1lb3V0KTtcclxuXHJcbiAgICAgICAgICAvLyBkaXNwbGF5IGxvYWRpbmcgaW5kaWNhdG9yIHdpdGggZGVsYXlcclxuICAgICAgICAgIF9sb2FkaW5nSW5kaWNhdG9yVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgICAgICBpZihwc3dwLmN1cnJJdGVtICYmIHBzd3AuY3Vyckl0ZW0ubG9hZGluZykge1xyXG5cclxuICAgICAgICAgICAgICBpZiggIXBzd3AuYWxsb3dQcm9ncmVzc2l2ZUltZygpIHx8IChwc3dwLmN1cnJJdGVtLmltZyAmJiAhcHN3cC5jdXJySXRlbS5pbWcubmF0dXJhbFdpZHRoKSAgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBzaG93IHByZWxvYWRlciBpZiBwcm9ncmVzc2l2ZSBsb2FkaW5nIGlzIG5vdCBlbmFibGVkLFxyXG4gICAgICAgICAgICAgICAgLy8gb3IgaW1hZ2Ugd2lkdGggaXMgbm90IGRlZmluZWQgeWV0IChiZWNhdXNlIG9mIHNsb3cgY29ubmVjdGlvbilcclxuICAgICAgICAgICAgICAgIF90b2dnbGVMb2FkaW5nSW5kaWNhdG9yKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIC8vIGl0ZW1zLWNvbnRyb2xsZXIuanMgZnVuY3Rpb24gYWxsb3dQcm9ncmVzc2l2ZUltZ1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgX3RvZ2dsZUxvYWRpbmdJbmRpY2F0b3IodHJ1ZSk7IC8vIGhpZGUgcHJlbG9hZGVyXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9LCBfb3B0aW9ucy5sb2FkaW5nSW5kaWNhdG9yRGVsYXkpO1xyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBfbGlzdGVuKCdpbWFnZUxvYWRDb21wbGV0ZScsIGZ1bmN0aW9uKGluZGV4LCBpdGVtKSB7XHJcbiAgICAgICAgICBpZihwc3dwLmN1cnJJdGVtID09PSBpdGVtKSB7XHJcbiAgICAgICAgICAgIF90b2dnbGVMb2FkaW5nSW5kaWNhdG9yKHRydWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF90b2dnbGVMb2FkaW5nSW5kaWNhdG9yID0gZnVuY3Rpb24oaGlkZSkge1xyXG4gICAgICBpZiggX2xvYWRpbmdJbmRpY2F0b3JIaWRkZW4gIT09IGhpZGUgKSB7XHJcbiAgICAgICAgX3RvZ2dsZVBzd3BDbGFzcyhfbG9hZGluZ0luZGljYXRvciwgJ3ByZWxvYWRlci0tYWN0aXZlJywgIWhpZGUpO1xyXG4gICAgICAgIF9sb2FkaW5nSW5kaWNhdG9ySGlkZGVuID0gaGlkZTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9hcHBseU5hdkJhckdhcHMgPSBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgIHZhciBnYXAgPSBpdGVtLnZHYXA7XHJcblxyXG4gICAgICBpZiggX2ZpdENvbnRyb2xzSW5WaWV3cG9ydCgpICkge1xyXG5cclxuICAgICAgICB2YXIgYmFycyA9IF9vcHRpb25zLmJhcnNTaXplO1xyXG4gICAgICAgIGlmKF9vcHRpb25zLmNhcHRpb25FbCAmJiBiYXJzLmJvdHRvbSA9PT0gJ2F1dG8nKSB7XHJcbiAgICAgICAgICBpZighX2Zha2VDYXB0aW9uQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIF9mYWtlQ2FwdGlvbkNvbnRhaW5lciA9IGZyYW1ld29yay5jcmVhdGVFbCgncHN3cF9fY2FwdGlvbiBwc3dwX19jYXB0aW9uLS1mYWtlJyk7XHJcbiAgICAgICAgICAgIF9mYWtlQ2FwdGlvbkNvbnRhaW5lci5hcHBlbmRDaGlsZCggZnJhbWV3b3JrLmNyZWF0ZUVsKCdwc3dwX19jYXB0aW9uX19jZW50ZXInKSApO1xyXG4gICAgICAgICAgICBfY29udHJvbHMuaW5zZXJ0QmVmb3JlKF9mYWtlQ2FwdGlvbkNvbnRhaW5lciwgX2NhcHRpb25Db250YWluZXIpO1xyXG4gICAgICAgICAgICBmcmFtZXdvcmsuYWRkQ2xhc3MoX2NvbnRyb2xzLCAncHN3cF9fdWktLWZpdCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYoIF9vcHRpb25zLmFkZENhcHRpb25IVE1MRm4oaXRlbSwgX2Zha2VDYXB0aW9uQ29udGFpbmVyLCB0cnVlKSApIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjYXB0aW9uU2l6ZSA9IF9mYWtlQ2FwdGlvbkNvbnRhaW5lci5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIGdhcC5ib3R0b20gPSBwYXJzZUludChjYXB0aW9uU2l6ZSwxMCkgfHwgNDQ7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnYXAuYm90dG9tID0gYmFycy50b3A7IC8vIGlmIG5vIGNhcHRpb24sIHNldCBzaXplIG9mIGJvdHRvbSBnYXAgdG8gc2l6ZSBvZiB0b3BcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZ2FwLmJvdHRvbSA9IGJhcnMuYm90dG9tID09PSAnYXV0bycgPyAwIDogYmFycy5ib3R0b207XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBoZWlnaHQgb2YgdG9wIGJhciBpcyBzdGF0aWMsIG5vIG5lZWQgdG8gY2FsY3VsYXRlIGl0XHJcbiAgICAgICAgZ2FwLnRvcCA9IGJhcnMudG9wO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGdhcC50b3AgPSBnYXAuYm90dG9tID0gMDtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXR1cElkbGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gSGlkZSBjb250cm9scyB3aGVuIG1vdXNlIGlzIHVzZWRcclxuICAgICAgaWYoX29wdGlvbnMudGltZVRvSWRsZSkge1xyXG4gICAgICAgIF9saXN0ZW4oJ21vdXNlVXNlZCcsIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAgIGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX29uSWRsZU1vdXNlTW92ZSk7XHJcbiAgICAgICAgICBmcmFtZXdvcmsuYmluZChkb2N1bWVudCwgJ21vdXNlb3V0JywgX29uTW91c2VMZWF2ZVdpbmRvdyk7XHJcblxyXG4gICAgICAgICAgX2lkbGVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBfaWRsZUluY3JlbWVudCsrO1xyXG4gICAgICAgICAgICBpZihfaWRsZUluY3JlbWVudCA9PT0gMikge1xyXG4gICAgICAgICAgICAgIHVpLnNldElkbGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIF9vcHRpb25zLnRpbWVUb0lkbGUgLyAyKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXR1cEhpZGluZ0NvbnRyb2xzRHVyaW5nR2VzdHVyZXMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIC8vIEhpZGUgY29udHJvbHMgb24gdmVydGljYWwgZHJhZ1xyXG4gICAgICBfbGlzdGVuKCdvblZlcnRpY2FsRHJhZycsIGZ1bmN0aW9uKG5vdykge1xyXG4gICAgICAgIGlmKF9jb250cm9sc1Zpc2libGUgJiYgbm93IDwgMC45NSkge1xyXG4gICAgICAgICAgdWkuaGlkZUNvbnRyb2xzKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmKCFfY29udHJvbHNWaXNpYmxlICYmIG5vdyA+PSAwLjk1KSB7XHJcbiAgICAgICAgICB1aS5zaG93Q29udHJvbHMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gSGlkZSBjb250cm9scyB3aGVuIHBpbmNoaW5nIHRvIGNsb3NlXHJcbiAgICAgIHZhciBwaW5jaENvbnRyb2xzSGlkZGVuO1xyXG4gICAgICBfbGlzdGVuKCdvblBpbmNoQ2xvc2UnICwgZnVuY3Rpb24obm93KSB7XHJcbiAgICAgICAgaWYoX2NvbnRyb2xzVmlzaWJsZSAmJiBub3cgPCAwLjkpIHtcclxuICAgICAgICAgIHVpLmhpZGVDb250cm9scygpO1xyXG4gICAgICAgICAgcGluY2hDb250cm9sc0hpZGRlbiA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmKHBpbmNoQ29udHJvbHNIaWRkZW4gJiYgIV9jb250cm9sc1Zpc2libGUgJiYgbm93ID4gMC45KSB7XHJcbiAgICAgICAgICB1aS5zaG93Q29udHJvbHMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgX2xpc3Rlbignem9vbUdlc3R1cmVFbmRlZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHBpbmNoQ29udHJvbHNIaWRkZW4gPSBmYWxzZTtcclxuICAgICAgICBpZihwaW5jaENvbnRyb2xzSGlkZGVuICYmICFfY29udHJvbHNWaXNpYmxlKSB7XHJcbiAgICAgICAgICB1aS5zaG93Q29udHJvbHMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgdmFyIF91aUVsZW1lbnRzID0gW1xyXG4gICAge1xyXG4gICAgICBuYW1lOiAnY2FwdGlvbicsXHJcbiAgICAgIG9wdGlvbjogJ2NhcHRpb25FbCcsXHJcbiAgICAgIG9uSW5pdDogZnVuY3Rpb24oZWwpIHtcclxuICAgICAgICBfY2FwdGlvbkNvbnRhaW5lciA9IGVsO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAnc2hhcmUtbW9kYWwnLFxyXG4gICAgICBvcHRpb246ICdzaGFyZUVsJyxcclxuICAgICAgb25Jbml0OiBmdW5jdGlvbihlbCkge1xyXG4gICAgICAgIF9zaGFyZU1vZGFsID0gZWw7XHJcbiAgICAgIH0sXHJcbiAgICAgIG9uVGFwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBfdG9nZ2xlU2hhcmVNb2RhbCgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAnYnV0dG9uLS1zaGFyZScsXHJcbiAgICAgIG9wdGlvbjogJ3NoYXJlRWwnLFxyXG4gICAgICBvbkluaXQ6IGZ1bmN0aW9uKGVsKSB7XHJcbiAgICAgICAgX3NoYXJlQnV0dG9uID0gZWw7XHJcbiAgICAgIH0sXHJcbiAgICAgIG9uVGFwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBfdG9nZ2xlU2hhcmVNb2RhbCgpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAnYnV0dG9uLS16b29tJyxcclxuICAgICAgb3B0aW9uOiAnem9vbUVsJyxcclxuICAgICAgb25UYXA6IHBzd3AudG9nZ2xlRGVza3RvcFpvb21cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6ICdjb3VudGVyJyxcclxuICAgICAgb3B0aW9uOiAnY291bnRlckVsJyxcclxuICAgICAgb25Jbml0OiBmdW5jdGlvbihlbCkge1xyXG4gICAgICAgIF9pbmRleEluZGljYXRvciA9IGVsO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAnYnV0dG9uLS1jbG9zZScsXHJcbiAgICAgIG9wdGlvbjogJ2Nsb3NlRWwnLFxyXG4gICAgICBvblRhcDogcHN3cC5jbG9zZVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgbmFtZTogJ2J1dHRvbi0tYXJyb3ctLWxlZnQnLFxyXG4gICAgICBvcHRpb246ICdhcnJvd0VsJyxcclxuICAgICAgb25UYXA6IHBzd3AucHJldlxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgbmFtZTogJ2J1dHRvbi0tYXJyb3ctLXJpZ2h0JyxcclxuICAgICAgb3B0aW9uOiAnYXJyb3dFbCcsXHJcbiAgICAgIG9uVGFwOiBwc3dwLm5leHRcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6ICdidXR0b24tLWZzJyxcclxuICAgICAgb3B0aW9uOiAnZnVsbHNjcmVlbkVsJyxcclxuICAgICAgb25UYXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmKF9mdWxsc2NyZW5BUEkuaXNGdWxsc2NyZWVuKCkpIHtcclxuICAgICAgICAgIF9mdWxsc2NyZW5BUEkuZXhpdCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBfZnVsbHNjcmVuQVBJLmVudGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBuYW1lOiAncHJlbG9hZGVyJyxcclxuICAgICAgb3B0aW9uOiAncHJlbG9hZGVyRWwnLFxyXG4gICAgICBvbkluaXQ6IGZ1bmN0aW9uKGVsKSB7XHJcbiAgICAgICAgX2xvYWRpbmdJbmRpY2F0b3IgPSBlbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICBdO1xyXG5cclxuICB2YXIgX3NldHVwVUlFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGl0ZW0sXHJcbiAgICAgIGNsYXNzQXR0cixcclxuICAgICAgdWlFbGVtZW50O1xyXG5cclxuICAgIHZhciBsb29wVGhyb3VnaENoaWxkRWxlbWVudHMgPSBmdW5jdGlvbihzQ2hpbGRyZW4pIHtcclxuICAgICAgaWYoIXNDaGlsZHJlbikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGwgPSBzQ2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaXRlbSA9IHNDaGlsZHJlbltpXTtcclxuICAgICAgICBjbGFzc0F0dHIgPSBpdGVtLmNsYXNzTmFtZTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBhID0gMDsgYSA8IF91aUVsZW1lbnRzLmxlbmd0aDsgYSsrKSB7XHJcbiAgICAgICAgICB1aUVsZW1lbnQgPSBfdWlFbGVtZW50c1thXTtcclxuXHJcbiAgICAgICAgICBpZihjbGFzc0F0dHIuaW5kZXhPZigncHN3cF9fJyArIHVpRWxlbWVudC5uYW1lKSA+IC0xICApIHtcclxuXHJcbiAgICAgICAgICAgIGlmKCBfb3B0aW9uc1t1aUVsZW1lbnQub3B0aW9uXSApIHsgLy8gaWYgZWxlbWVudCBpcyBub3QgZGlzYWJsZWQgZnJvbSBvcHRpb25zXHJcblxyXG4gICAgICAgICAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhpdGVtLCAncHN3cF9fZWxlbWVudC0tZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgICBpZih1aUVsZW1lbnQub25Jbml0KSB7XHJcbiAgICAgICAgICAgICAgICB1aUVsZW1lbnQub25Jbml0KGl0ZW0pO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy9pdGVtLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGZyYW1ld29yay5hZGRDbGFzcyhpdGVtLCAncHN3cF9fZWxlbWVudC0tZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgICAvL2l0ZW0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIGxvb3BUaHJvdWdoQ2hpbGRFbGVtZW50cyhfY29udHJvbHMuY2hpbGRyZW4pO1xyXG5cclxuICAgIHZhciB0b3BCYXIgPSAgZnJhbWV3b3JrLmdldENoaWxkQnlDbGFzcyhfY29udHJvbHMsICdwc3dwX190b3AtYmFyJyk7XHJcbiAgICBpZih0b3BCYXIpIHtcclxuICAgICAgbG9vcFRocm91Z2hDaGlsZEVsZW1lbnRzKCB0b3BCYXIuY2hpbGRyZW4gKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcblxyXG5cclxuICB1aS5pbml0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gZXh0ZW5kIG9wdGlvbnNcclxuICAgIGZyYW1ld29yay5leHRlbmQocHN3cC5vcHRpb25zLCBfZGVmYXVsdFVJT3B0aW9ucywgdHJ1ZSk7XHJcblxyXG4gICAgLy8gY3JlYXRlIGxvY2FsIGxpbmsgZm9yIGZhc3QgYWNjZXNzXHJcbiAgICBfb3B0aW9ucyA9IHBzd3Aub3B0aW9ucztcclxuXHJcbiAgICAvLyBmaW5kIHBzd3BfX3VpIGVsZW1lbnRcclxuICAgIF9jb250cm9scyA9IGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3MocHN3cC5zY3JvbGxXcmFwLCAncHN3cF9fdWknKTtcclxuXHJcbiAgICAvLyBjcmVhdGUgbG9jYWwgbGlua1xyXG4gICAgX2xpc3RlbiA9IHBzd3AubGlzdGVuO1xyXG5cclxuXHJcbiAgICBfc2V0dXBIaWRpbmdDb250cm9sc0R1cmluZ0dlc3R1cmVzKCk7XHJcblxyXG4gICAgLy8gdXBkYXRlIGNvbnRyb2xzIHdoZW4gc2xpZGVzIGNoYW5nZVxyXG4gICAgX2xpc3RlbignYmVmb3JlQ2hhbmdlJywgdWkudXBkYXRlKTtcclxuXHJcbiAgICAvLyB0b2dnbGUgem9vbSBvbiBkb3VibGUtdGFwXHJcbiAgICBfbGlzdGVuKCdkb3VibGVUYXAnLCBmdW5jdGlvbihwb2ludCkge1xyXG4gICAgICB2YXIgaW5pdGlhbFpvb21MZXZlbCA9IHBzd3AuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbDtcclxuICAgICAgaWYocHN3cC5nZXRab29tTGV2ZWwoKSAhPT0gaW5pdGlhbFpvb21MZXZlbCkge1xyXG4gICAgICAgIHBzd3Auem9vbVRvKGluaXRpYWxab29tTGV2ZWwsIHBvaW50LCAzMzMpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBzd3Auem9vbVRvKF9vcHRpb25zLmdldERvdWJsZVRhcFpvb20oZmFsc2UsIHBzd3AuY3Vyckl0ZW0pLCBwb2ludCwgMzMzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQWxsb3cgdGV4dCBzZWxlY3Rpb24gaW4gY2FwdGlvblxyXG4gICAgX2xpc3RlbigncHJldmVudERyYWdFdmVudCcsIGZ1bmN0aW9uKGUsIGlzRG93biwgcHJldmVudE9iaikge1xyXG4gICAgICB2YXIgdCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuICAgICAgaWYoXHJcbiAgICAgICAgdCAmJlxyXG4gICAgICAgIHQuZ2V0QXR0cmlidXRlKCdjbGFzcycpICYmIGUudHlwZS5pbmRleE9mKCdtb3VzZScpID4gLTEgJiZcclxuICAgICAgICAoIHQuZ2V0QXR0cmlidXRlKCdjbGFzcycpLmluZGV4T2YoJ19fY2FwdGlvbicpID4gMCB8fCAoLyhTTUFMTHxTVFJPTkd8RU0pL2kpLnRlc3QodC50YWdOYW1lKSApXHJcbiAgICAgICkge1xyXG4gICAgICAgIHByZXZlbnRPYmoucHJldmVudCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBiaW5kIGV2ZW50cyBmb3IgVUlcclxuICAgIF9saXN0ZW4oJ2JpbmRFdmVudHMnLCBmdW5jdGlvbigpIHtcclxuICAgICAgZnJhbWV3b3JrLmJpbmQoX2NvbnRyb2xzLCAncHN3cFRhcCBjbGljaycsIF9vbkNvbnRyb2xzVGFwKTtcclxuICAgICAgZnJhbWV3b3JrLmJpbmQocHN3cC5zY3JvbGxXcmFwLCAncHN3cFRhcCcsIHVpLm9uR2xvYmFsVGFwKTtcclxuXHJcbiAgICAgIGlmKCFwc3dwLmxpa2VseVRvdWNoRGV2aWNlKSB7XHJcbiAgICAgICAgZnJhbWV3b3JrLmJpbmQocHN3cC5zY3JvbGxXcmFwLCAnbW91c2VvdmVyJywgdWkub25Nb3VzZU92ZXIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyB1bmJpbmQgZXZlbnRzIGZvciBVSVxyXG4gICAgX2xpc3RlbigndW5iaW5kRXZlbnRzJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xyXG4gICAgICAgIF90b2dnbGVTaGFyZU1vZGFsKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKF9pZGxlSW50ZXJ2YWwpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKF9pZGxlSW50ZXJ2YWwpO1xyXG4gICAgICB9XHJcbiAgICAgIGZyYW1ld29yay51bmJpbmQoZG9jdW1lbnQsICdtb3VzZW91dCcsIF9vbk1vdXNlTGVhdmVXaW5kb3cpO1xyXG4gICAgICBmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX29uSWRsZU1vdXNlTW92ZSk7XHJcbiAgICAgIGZyYW1ld29yay51bmJpbmQoX2NvbnRyb2xzLCAncHN3cFRhcCBjbGljaycsIF9vbkNvbnRyb2xzVGFwKTtcclxuICAgICAgZnJhbWV3b3JrLnVuYmluZChwc3dwLnNjcm9sbFdyYXAsICdwc3dwVGFwJywgdWkub25HbG9iYWxUYXApO1xyXG4gICAgICBmcmFtZXdvcmsudW5iaW5kKHBzd3Auc2Nyb2xsV3JhcCwgJ21vdXNlb3ZlcicsIHVpLm9uTW91c2VPdmVyKTtcclxuXHJcbiAgICAgIGlmKF9mdWxsc2NyZW5BUEkpIHtcclxuICAgICAgICBmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCBfZnVsbHNjcmVuQVBJLmV2ZW50SywgdWkudXBkYXRlRnVsbHNjcmVlbik7XHJcbiAgICAgICAgaWYoX2Z1bGxzY3JlbkFQSS5pc0Z1bGxzY3JlZW4oKSkge1xyXG4gICAgICAgICAgX29wdGlvbnMuaGlkZUFuaW1hdGlvbkR1cmF0aW9uID0gMDtcclxuICAgICAgICAgIF9mdWxsc2NyZW5BUEkuZXhpdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfZnVsbHNjcmVuQVBJID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIGNsZWFuIHVwIHRoaW5ncyB3aGVuIGdhbGxlcnkgaXMgZGVzdHJveWVkXHJcbiAgICBfbGlzdGVuKCdkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmKF9vcHRpb25zLmNhcHRpb25FbCkge1xyXG4gICAgICAgIGlmKF9mYWtlQ2FwdGlvbkNvbnRhaW5lcikge1xyXG4gICAgICAgICAgX2NvbnRyb2xzLnJlbW92ZUNoaWxkKF9mYWtlQ2FwdGlvbkNvbnRhaW5lcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhfY2FwdGlvbkNvbnRhaW5lciwgJ3Bzd3BfX2NhcHRpb24tLWVtcHR5Jyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKF9zaGFyZU1vZGFsKSB7XHJcbiAgICAgICAgX3NoYXJlTW9kYWwuY2hpbGRyZW5bMF0ub25jbGljayA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgZnJhbWV3b3JrLnJlbW92ZUNsYXNzKF9jb250cm9scywgJ3Bzd3BfX3VpLS1vdmVyLWNsb3NlJyk7XHJcbiAgICAgIGZyYW1ld29yay5hZGRDbGFzcyggX2NvbnRyb2xzLCAncHN3cF9fdWktLWhpZGRlbicpO1xyXG4gICAgICB1aS5zZXRJZGxlKGZhbHNlKTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBpZighX29wdGlvbnMuc2hvd0FuaW1hdGlvbkR1cmF0aW9uKSB7XHJcbiAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyggX2NvbnRyb2xzLCAncHN3cF9fdWktLWhpZGRlbicpO1xyXG4gICAgfVxyXG4gICAgX2xpc3RlbignaW5pdGlhbFpvb21JbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZihfb3B0aW9ucy5zaG93QW5pbWF0aW9uRHVyYXRpb24pIHtcclxuICAgICAgICBmcmFtZXdvcmsucmVtb3ZlQ2xhc3MoIF9jb250cm9scywgJ3Bzd3BfX3VpLS1oaWRkZW4nKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBfbGlzdGVuKCdpbml0aWFsWm9vbU91dCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICBmcmFtZXdvcmsuYWRkQ2xhc3MoIF9jb250cm9scywgJ3Bzd3BfX3VpLS1oaWRkZW4nKTtcclxuICAgIH0pO1xyXG5cclxuICAgIF9saXN0ZW4oJ3BhcnNlVmVydGljYWxNYXJnaW4nLCBfYXBwbHlOYXZCYXJHYXBzKTtcclxuXHJcbiAgICBfc2V0dXBVSUVsZW1lbnRzKCk7XHJcblxyXG4gICAgaWYoX29wdGlvbnMuc2hhcmVFbCAmJiBfc2hhcmVCdXR0b24gJiYgX3NoYXJlTW9kYWwpIHtcclxuICAgICAgX3NoYXJlTW9kYWxIaWRkZW4gPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIF9jb3VudE51bUl0ZW1zKCk7XHJcblxyXG4gICAgX3NldHVwSWRsZSgpO1xyXG5cclxuICAgIF9zZXR1cEZ1bGxzY3JlZW5BUEkoKTtcclxuXHJcbiAgICBfc2V0dXBMb2FkaW5nSW5kaWNhdG9yKCk7XHJcbiAgfTtcclxuXHJcbiAgdWkuc2V0SWRsZSA9IGZ1bmN0aW9uKGlzSWRsZSkge1xyXG4gICAgX2lzSWRsZSA9IGlzSWRsZTtcclxuICAgIF90b2dnbGVQc3dwQ2xhc3MoX2NvbnRyb2xzLCAndWktLWlkbGUnLCBpc0lkbGUpO1xyXG4gIH07XHJcblxyXG4gIHVpLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gRG9uJ3QgdXBkYXRlIFVJIGlmIGl0J3MgaGlkZGVuXHJcbiAgICBpZihfY29udHJvbHNWaXNpYmxlICYmIHBzd3AuY3Vyckl0ZW0pIHtcclxuXHJcbiAgICAgIHVpLnVwZGF0ZUluZGV4SW5kaWNhdG9yKCk7XHJcblxyXG4gICAgICBpZihfb3B0aW9ucy5jYXB0aW9uRWwpIHtcclxuICAgICAgICBfb3B0aW9ucy5hZGRDYXB0aW9uSFRNTEZuKHBzd3AuY3Vyckl0ZW0sIF9jYXB0aW9uQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgX3RvZ2dsZVBzd3BDbGFzcyhfY2FwdGlvbkNvbnRhaW5lciwgJ2NhcHRpb24tLWVtcHR5JywgIXBzd3AuY3Vyckl0ZW0udGl0bGUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBfb3ZlcmxheVVJVXBkYXRlZCA9IHRydWU7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgX292ZXJsYXlVSVVwZGF0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZighX3NoYXJlTW9kYWxIaWRkZW4pIHtcclxuICAgICAgX3RvZ2dsZVNoYXJlTW9kYWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBfY291bnROdW1JdGVtcygpO1xyXG4gIH07XHJcblxyXG4gIHVpLnVwZGF0ZUZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlKSB7XHJcblxyXG4gICAgaWYoZSkge1xyXG4gICAgICAvLyBzb21lIGJyb3dzZXJzIGNoYW5nZSB3aW5kb3cgc2Nyb2xsIHBvc2l0aW9uIGR1cmluZyB0aGUgZnVsbHNjcmVlblxyXG4gICAgICAvLyBzbyBQaG90b1N3aXBlIHVwZGF0ZXMgaXQganVzdCBpbiBjYXNlXHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcHN3cC5zZXRTY3JvbGxPZmZzZXQoIDAsIGZyYW1ld29yay5nZXRTY3JvbGxZKCkgKTtcclxuICAgICAgfSwgNTApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRvb2dsZSBwc3dwLS1mcyBjbGFzcyBvbiByb290IGVsZW1lbnRcclxuICAgIGZyYW1ld29ya1sgKF9mdWxsc2NyZW5BUEkuaXNGdWxsc2NyZWVuKCkgPyAnYWRkJyA6ICdyZW1vdmUnKSArICdDbGFzcycgXShwc3dwLnRlbXBsYXRlLCAncHN3cC0tZnMnKTtcclxuICB9O1xyXG5cclxuICB1aS51cGRhdGVJbmRleEluZGljYXRvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYoX29wdGlvbnMuY291bnRlckVsKSB7XHJcbiAgICAgIF9pbmRleEluZGljYXRvci5pbm5lckhUTUwgPSAocHN3cC5nZXRDdXJyZW50SW5kZXgoKSsxKSArXHJcbiAgICAgICAgICAgICAgICAgICAgX29wdGlvbnMuaW5kZXhJbmRpY2F0b3JTZXAgK1xyXG4gICAgICAgICAgICAgICAgICAgIF9vcHRpb25zLmdldE51bUl0ZW1zRm4oKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB1aS5vbkdsb2JhbFRhcCA9IGZ1bmN0aW9uKGUpIHtcclxuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcclxuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XHJcblxyXG4gICAgaWYoX2Jsb2NrQ29udHJvbHNUYXApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKGUuZGV0YWlsICYmIGUuZGV0YWlsLnBvaW50ZXJUeXBlID09PSAnbW91c2UnKSB7XHJcblxyXG4gICAgICAvLyBjbG9zZSBnYWxsZXJ5IGlmIGNsaWNrZWQgb3V0c2lkZSBvZiB0aGUgaW1hZ2VcclxuICAgICAgaWYoX2hhc0Nsb3NlQ2xhc3ModGFyZ2V0KSkge1xyXG4gICAgICAgIHBzd3AuY2xvc2UoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKGZyYW1ld29yay5oYXNDbGFzcyh0YXJnZXQsICdwc3dwX19pbWcnKSkge1xyXG4gICAgICAgIGlmKHBzd3AuZ2V0Wm9vbUxldmVsKCkgPT09IDEgJiYgcHN3cC5nZXRab29tTGV2ZWwoKSA8PSBwc3dwLmN1cnJJdGVtLmZpdFJhdGlvKSB7XHJcbiAgICAgICAgICBpZihfb3B0aW9ucy5jbGlja1RvQ2xvc2VOb25ab29tYWJsZSkge1xyXG4gICAgICAgICAgICBwc3dwLmNsb3NlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHBzd3AudG9nZ2xlRGVza3RvcFpvb20oZS5kZXRhaWwucmVsZWFzZVBvaW50KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgLy8gdGFwIGFueXdoZXJlIChleGNlcHQgYnV0dG9ucykgdG8gdG9nZ2xlIHZpc2liaWxpdHkgb2YgY29udHJvbHNcclxuICAgICAgaWYoX29wdGlvbnMudGFwVG9Ub2dnbGVDb250cm9scykge1xyXG4gICAgICAgIGlmKF9jb250cm9sc1Zpc2libGUpIHtcclxuICAgICAgICAgIHVpLmhpZGVDb250cm9scygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB1aS5zaG93Q29udHJvbHMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHRhcCB0byBjbG9zZSBnYWxsZXJ5XHJcbiAgICAgIGlmKF9vcHRpb25zLnRhcFRvQ2xvc2UgJiYgKGZyYW1ld29yay5oYXNDbGFzcyh0YXJnZXQsICdwc3dwX19pbWcnKSB8fCBfaGFzQ2xvc2VDbGFzcyh0YXJnZXQpKSApIHtcclxuICAgICAgICBwc3dwLmNsb3NlKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG4gIH07XHJcbiAgdWkub25Nb3VzZU92ZXIgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XHJcbiAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xyXG5cclxuICAgIC8vIGFkZCBjbGFzcyB3aGVuIG1vdXNlIGlzIG92ZXIgYW4gZWxlbWVudCB0aGF0IHNob3VsZCBjbG9zZSB0aGUgZ2FsbGVyeVxyXG4gICAgX3RvZ2dsZVBzd3BDbGFzcyhfY29udHJvbHMsICd1aS0tb3Zlci1jbG9zZScsIF9oYXNDbG9zZUNsYXNzKHRhcmdldCkpO1xyXG4gIH07XHJcblxyXG4gIHVpLmhpZGVDb250cm9scyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZnJhbWV3b3JrLmFkZENsYXNzKF9jb250cm9scywncHN3cF9fdWktLWhpZGRlbicpO1xyXG4gICAgX2NvbnRyb2xzVmlzaWJsZSA9IGZhbHNlO1xyXG4gIH07XHJcblxyXG4gIHVpLnNob3dDb250cm9scyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX2NvbnRyb2xzVmlzaWJsZSA9IHRydWU7XHJcbiAgICBpZighX292ZXJsYXlVSVVwZGF0ZWQpIHtcclxuICAgICAgdWkudXBkYXRlKCk7XHJcbiAgICB9XHJcbiAgICBmcmFtZXdvcmsucmVtb3ZlQ2xhc3MoX2NvbnRyb2xzLCdwc3dwX191aS0taGlkZGVuJyk7XHJcbiAgfTtcclxuXHJcbiAgdWkuc3VwcG9ydHNGdWxsc2NyZWVuID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgZCA9IGRvY3VtZW50O1xyXG4gICAgcmV0dXJuICEhKGQuZXhpdEZ1bGxzY3JlZW4gfHwgZC5tb3pDYW5jZWxGdWxsU2NyZWVuIHx8IGQud2Via2l0RXhpdEZ1bGxzY3JlZW4gfHwgZC5tc0V4aXRGdWxsc2NyZWVuKTtcclxuICB9O1xyXG5cclxuICB1aS5nZXRGdWxsc2NyZWVuQVBJID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgZEUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXHJcbiAgICAgIGFwaSxcclxuICAgICAgdEYgPSAnZnVsbHNjcmVlbmNoYW5nZSc7XHJcblxyXG4gICAgaWYgKGRFLnJlcXVlc3RGdWxsc2NyZWVuKSB7XHJcbiAgICAgIGFwaSA9IHtcclxuICAgICAgICBlbnRlcks6ICdyZXF1ZXN0RnVsbHNjcmVlbicsXHJcbiAgICAgICAgZXhpdEs6ICdleGl0RnVsbHNjcmVlbicsXHJcbiAgICAgICAgZWxlbWVudEs6ICdmdWxsc2NyZWVuRWxlbWVudCcsXHJcbiAgICAgICAgZXZlbnRLOiB0RlxyXG4gICAgICB9O1xyXG5cclxuICAgIH0gZWxzZSBpZihkRS5tb3pSZXF1ZXN0RnVsbFNjcmVlbiApIHtcclxuICAgICAgYXBpID0ge1xyXG4gICAgICAgIGVudGVySzogJ21velJlcXVlc3RGdWxsU2NyZWVuJyxcclxuICAgICAgICBleGl0SzogJ21vekNhbmNlbEZ1bGxTY3JlZW4nLFxyXG4gICAgICAgIGVsZW1lbnRLOiAnbW96RnVsbFNjcmVlbkVsZW1lbnQnLFxyXG4gICAgICAgIGV2ZW50SzogJ21veicgKyB0RlxyXG4gICAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgfSBlbHNlIGlmKGRFLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XHJcbiAgICAgIGFwaSA9IHtcclxuICAgICAgICBlbnRlcks6ICd3ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbicsXHJcbiAgICAgICAgZXhpdEs6ICd3ZWJraXRFeGl0RnVsbHNjcmVlbicsXHJcbiAgICAgICAgZWxlbWVudEs6ICd3ZWJraXRGdWxsc2NyZWVuRWxlbWVudCcsXHJcbiAgICAgICAgZXZlbnRLOiAnd2Via2l0JyArIHRGXHJcbiAgICAgIH07XHJcblxyXG4gICAgfSBlbHNlIGlmKGRFLm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcclxuICAgICAgYXBpID0ge1xyXG4gICAgICAgIGVudGVySzogJ21zUmVxdWVzdEZ1bGxzY3JlZW4nLFxyXG4gICAgICAgIGV4aXRLOiAnbXNFeGl0RnVsbHNjcmVlbicsXHJcbiAgICAgICAgZWxlbWVudEs6ICdtc0Z1bGxzY3JlZW5FbGVtZW50JyxcclxuICAgICAgICBldmVudEs6ICdNU0Z1bGxzY3JlZW5DaGFuZ2UnXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYoYXBpKSB7XHJcbiAgICAgIGFwaS5lbnRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIGRpc2FibGUgY2xvc2Utb24tc2Nyb2xsIGluIGZ1bGxzY3JlZW5cclxuICAgICAgICBfaW5pdGFsQ2xvc2VPblNjcm9sbFZhbHVlID0gX29wdGlvbnMuY2xvc2VPblNjcm9sbDtcclxuICAgICAgICBfb3B0aW9ucy5jbG9zZU9uU2Nyb2xsID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmKHRoaXMuZW50ZXJLID09PSAnd2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4nKSB7XHJcbiAgICAgICAgICBwc3dwLnRlbXBsYXRlW3RoaXMuZW50ZXJLXSggRWxlbWVudC5BTExPV19LRVlCT0FSRF9JTlBVVCApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gcHN3cC50ZW1wbGF0ZVt0aGlzLmVudGVyS10oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIGFwaS5leGl0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX29wdGlvbnMuY2xvc2VPblNjcm9sbCA9IF9pbml0YWxDbG9zZU9uU2Nyb2xsVmFsdWU7XHJcblxyXG4gICAgICAgIHJldHVybiBkb2N1bWVudFt0aGlzLmV4aXRLXSgpO1xyXG5cclxuICAgICAgfTtcclxuICAgICAgYXBpLmlzRnVsbHNjcmVlbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZG9jdW1lbnRbdGhpcy5lbGVtZW50S107IH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFwaTtcclxuICB9O1xyXG5cclxuXHJcblxyXG59O1xyXG5yZXR1cm4gUGhvdG9Td2lwZVVJX0RlZmF1bHQ7XHJcblxyXG5cclxufSk7XHJcbiIsIi8qISBQaG90b1N3aXBlIC0gdjQuMS4xIC0gMjAxNS0xMi0yNFxyXG4qIGh0dHA6Ly9waG90b3N3aXBlLmNvbVxyXG4qIENvcHlyaWdodCAoYykgMjAxNSBEbWl0cnkgU2VtZW5vdjsgKi9cclxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7IFxyXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuXHRcdGRlZmluZShmYWN0b3J5KTtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJvb3QuUGhvdG9Td2lwZSA9IGZhY3RvcnkoKTtcclxuXHR9XHJcbn0pKHRoaXMsIGZ1bmN0aW9uICgpIHtcclxuXHJcblx0J3VzZSBzdHJpY3QnO1xyXG5cdHZhciBQaG90b1N3aXBlID0gZnVuY3Rpb24odGVtcGxhdGUsIFVpQ2xhc3MsIGl0ZW1zLCBvcHRpb25zKXtcclxuXHJcbi8qPj5mcmFtZXdvcmstYnJpZGdlKi9cclxuLyoqXHJcbiAqXHJcbiAqIFNldCBvZiBnZW5lcmljIGZ1bmN0aW9ucyB1c2VkIGJ5IGdhbGxlcnkuXHJcbiAqIFxyXG4gKiBZb3UncmUgZnJlZSB0byBtb2RpZnkgYW55dGhpbmcgaGVyZSBhcyBsb25nIGFzIGZ1bmN0aW9uYWxpdHkgaXMga2VwdC5cclxuICogXHJcbiAqL1xyXG52YXIgZnJhbWV3b3JrID0ge1xyXG5cdGZlYXR1cmVzOiBudWxsLFxyXG5cdGJpbmQ6IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIsIHVuYmluZCkge1xyXG5cdFx0dmFyIG1ldGhvZE5hbWUgPSAodW5iaW5kID8gJ3JlbW92ZScgOiAnYWRkJykgKyAnRXZlbnRMaXN0ZW5lcic7XHJcblx0XHR0eXBlID0gdHlwZS5zcGxpdCgnICcpO1xyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IHR5cGUubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYodHlwZVtpXSkge1xyXG5cdFx0XHRcdHRhcmdldFttZXRob2ROYW1lXSggdHlwZVtpXSwgbGlzdGVuZXIsIGZhbHNlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0aXNBcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcblx0XHRyZXR1cm4gKG9iaiBpbnN0YW5jZW9mIEFycmF5KTtcclxuXHR9LFxyXG5cdGNyZWF0ZUVsOiBmdW5jdGlvbihjbGFzc2VzLCB0YWcpIHtcclxuXHRcdHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnIHx8ICdkaXYnKTtcclxuXHRcdGlmKGNsYXNzZXMpIHtcclxuXHRcdFx0ZWwuY2xhc3NOYW1lID0gY2xhc3NlcztcclxuXHRcdH1cclxuXHRcdHJldHVybiBlbDtcclxuXHR9LFxyXG5cdGdldFNjcm9sbFk6IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHlPZmZzZXQgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XHJcblx0XHRyZXR1cm4geU9mZnNldCAhPT0gdW5kZWZpbmVkID8geU9mZnNldCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XHJcblx0fSxcclxuXHR1bmJpbmQ6IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIpIHtcclxuXHRcdGZyYW1ld29yay5iaW5kKHRhcmdldCx0eXBlLGxpc3RlbmVyLHRydWUpO1xyXG5cdH0sXHJcblx0cmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcclxuXHRcdHZhciByZWcgPSBuZXcgUmVnRXhwKCcoXFxcXHN8XiknICsgY2xhc3NOYW1lICsgJyhcXFxcc3wkKScpO1xyXG5cdFx0ZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UocmVnLCAnICcpLnJlcGxhY2UoL15cXHNcXHMqLywgJycpLnJlcGxhY2UoL1xcc1xccyokLywgJycpOyBcclxuXHR9LFxyXG5cdGFkZENsYXNzOiBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XHJcblx0XHRpZiggIWZyYW1ld29yay5oYXNDbGFzcyhlbCxjbGFzc05hbWUpICkge1xyXG5cdFx0XHRlbC5jbGFzc05hbWUgKz0gKGVsLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArIGNsYXNzTmFtZTtcclxuXHRcdH1cclxuXHR9LFxyXG5cdGhhc0NsYXNzOiBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XHJcblx0XHRyZXR1cm4gZWwuY2xhc3NOYW1lICYmIG5ldyBSZWdFeHAoJyhefFxcXFxzKScgKyBjbGFzc05hbWUgKyAnKFxcXFxzfCQpJykudGVzdChlbC5jbGFzc05hbWUpO1xyXG5cdH0sXHJcblx0Z2V0Q2hpbGRCeUNsYXNzOiBmdW5jdGlvbihwYXJlbnRFbCwgY2hpbGRDbGFzc05hbWUpIHtcclxuXHRcdHZhciBub2RlID0gcGFyZW50RWwuZmlyc3RDaGlsZDtcclxuXHRcdHdoaWxlKG5vZGUpIHtcclxuXHRcdFx0aWYoIGZyYW1ld29yay5oYXNDbGFzcyhub2RlLCBjaGlsZENsYXNzTmFtZSkgKSB7XHJcblx0XHRcdFx0cmV0dXJuIG5vZGU7XHJcblx0XHRcdH1cclxuXHRcdFx0bm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XHJcblx0XHR9XHJcblx0fSxcclxuXHRhcnJheVNlYXJjaDogZnVuY3Rpb24oYXJyYXksIHZhbHVlLCBrZXkpIHtcclxuXHRcdHZhciBpID0gYXJyYXkubGVuZ3RoO1xyXG5cdFx0d2hpbGUoaS0tKSB7XHJcblx0XHRcdGlmKGFycmF5W2ldW2tleV0gPT09IHZhbHVlKSB7XHJcblx0XHRcdFx0cmV0dXJuIGk7XHJcblx0XHRcdH0gXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fSxcclxuXHRleHRlbmQ6IGZ1bmN0aW9uKG8xLCBvMiwgcHJldmVudE92ZXJ3cml0ZSkge1xyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBvMikge1xyXG5cdFx0XHRpZiAobzIuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuXHRcdFx0XHRpZihwcmV2ZW50T3ZlcndyaXRlICYmIG8xLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bzFbcHJvcF0gPSBvMltwcm9wXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0ZWFzaW5nOiB7XHJcblx0XHRzaW5lOiB7XHJcblx0XHRcdG91dDogZnVuY3Rpb24oaykge1xyXG5cdFx0XHRcdHJldHVybiBNYXRoLnNpbihrICogKE1hdGguUEkgLyAyKSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGluT3V0OiBmdW5jdGlvbihrKSB7XHJcblx0XHRcdFx0cmV0dXJuIC0gKE1hdGguY29zKE1hdGguUEkgKiBrKSAtIDEpIC8gMjtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdGN1YmljOiB7XHJcblx0XHRcdG91dDogZnVuY3Rpb24oaykge1xyXG5cdFx0XHRcdHJldHVybiAtLWsgKiBrICogayArIDE7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8qXHJcblx0XHRcdGVsYXN0aWM6IHtcclxuXHRcdFx0XHRvdXQ6IGZ1bmN0aW9uICggayApIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgcywgYSA9IDAuMSwgcCA9IDAuNDtcclxuXHRcdFx0XHRcdGlmICggayA9PT0gMCApIHJldHVybiAwO1xyXG5cdFx0XHRcdFx0aWYgKCBrID09PSAxICkgcmV0dXJuIDE7XHJcblx0XHRcdFx0XHRpZiAoICFhIHx8IGEgPCAxICkgeyBhID0gMTsgcyA9IHAgLyA0OyB9XHJcblx0XHRcdFx0XHRlbHNlIHMgPSBwICogTWF0aC5hc2luKCAxIC8gYSApIC8gKCAyICogTWF0aC5QSSApO1xyXG5cdFx0XHRcdFx0cmV0dXJuICggYSAqIE1hdGgucG93KCAyLCAtIDEwICogaykgKiBNYXRoLnNpbiggKCBrIC0gcyApICogKCAyICogTWF0aC5QSSApIC8gcCApICsgMSApO1xyXG5cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9LFxyXG5cdFx0XHRiYWNrOiB7XHJcblx0XHRcdFx0b3V0OiBmdW5jdGlvbiAoIGsgKSB7XHJcblx0XHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XHJcblx0XHRcdFx0XHRyZXR1cm4gLS1rICogayAqICggKCBzICsgMSApICogayArIHMgKSArIDE7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHQqL1xyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEByZXR1cm4ge29iamVjdH1cclxuXHQgKiBcclxuXHQgKiB7XHJcblx0ICogIHJhZiA6IHJlcXVlc3QgYW5pbWF0aW9uIGZyYW1lIGZ1bmN0aW9uXHJcblx0ICogIGNhZiA6IGNhbmNlbCBhbmltYXRpb24gZnJhbWUgZnVuY3Rpb25cclxuXHQgKiAgdHJhbnNmcm9tIDogdHJhbnNmb3JtIHByb3BlcnR5IGtleSAod2l0aCB2ZW5kb3IpLCBvciBudWxsIGlmIG5vdCBzdXBwb3J0ZWRcclxuXHQgKiAgb2xkSUUgOiBJRTggb3IgYmVsb3dcclxuXHQgKiB9XHJcblx0ICogXHJcblx0ICovXHJcblx0ZGV0ZWN0RmVhdHVyZXM6IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoZnJhbWV3b3JrLmZlYXR1cmVzKSB7XHJcblx0XHRcdHJldHVybiBmcmFtZXdvcmsuZmVhdHVyZXM7XHJcblx0XHR9XHJcblx0XHR2YXIgaGVscGVyRWwgPSBmcmFtZXdvcmsuY3JlYXRlRWwoKSxcclxuXHRcdFx0aGVscGVyU3R5bGUgPSBoZWxwZXJFbC5zdHlsZSxcclxuXHRcdFx0dmVuZG9yID0gJycsXHJcblx0XHRcdGZlYXR1cmVzID0ge307XHJcblxyXG5cdFx0Ly8gSUU4IGFuZCBiZWxvd1xyXG5cdFx0ZmVhdHVyZXMub2xkSUUgPSBkb2N1bWVudC5hbGwgJiYgIWRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXI7XHJcblxyXG5cdFx0ZmVhdHVyZXMudG91Y2ggPSAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3c7XHJcblxyXG5cdFx0aWYod2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xyXG5cdFx0XHRmZWF0dXJlcy5yYWYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xyXG5cdFx0XHRmZWF0dXJlcy5jYWYgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcblx0XHR9XHJcblxyXG5cdFx0ZmVhdHVyZXMucG9pbnRlckV2ZW50ID0gbmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkIHx8IG5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkO1xyXG5cclxuXHRcdC8vIGZpeCBmYWxzZS1wb3NpdGl2ZSBkZXRlY3Rpb24gb2Ygb2xkIEFuZHJvaWQgaW4gbmV3IElFXHJcblx0XHQvLyAoSUUxMSB1YSBzdHJpbmcgY29udGFpbnMgXCJBbmRyb2lkIDQuMFwiKVxyXG5cdFx0XHJcblx0XHRpZighZmVhdHVyZXMucG9pbnRlckV2ZW50KSB7IFxyXG5cclxuXHRcdFx0dmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcclxuXHJcblx0XHRcdC8vIERldGVjdCBpZiBkZXZpY2UgaXMgaVBob25lIG9yIGlQb2QgYW5kIGlmIGl0J3Mgb2xkZXIgdGhhbiBpT1MgOFxyXG5cdFx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNDIyMzkyMFxyXG5cdFx0XHQvLyBcclxuXHRcdFx0Ly8gVGhpcyBkZXRlY3Rpb24gaXMgbWFkZSBiZWNhdXNlIG9mIGJ1Z2d5IHRvcC9ib3R0b20gdG9vbGJhcnNcclxuXHRcdFx0Ly8gdGhhdCBkb24ndCB0cmlnZ2VyIHdpbmRvdy5yZXNpemUgZXZlbnQuXHJcblx0XHRcdC8vIEZvciBtb3JlIGluZm8gcmVmZXIgdG8gX2lzRml4ZWRQb3NpdGlvbiB2YXJpYWJsZSBpbiBjb3JlLmpzXHJcblxyXG5cdFx0XHRpZiAoL2lQKGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkpIHtcclxuXHRcdFx0XHR2YXIgdiA9IChuYXZpZ2F0b3IuYXBwVmVyc2lvbikubWF0Y2goL09TIChcXGQrKV8oXFxkKylfPyhcXGQrKT8vKTtcclxuXHRcdFx0XHRpZih2ICYmIHYubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdFx0diA9IHBhcnNlSW50KHZbMV0sIDEwKTtcclxuXHRcdFx0XHRcdGlmKHYgPj0gMSAmJiB2IDwgOCApIHtcclxuXHRcdFx0XHRcdFx0ZmVhdHVyZXMuaXNPbGRJT1NQaG9uZSA9IHRydWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBEZXRlY3Qgb2xkIEFuZHJvaWQgKGJlZm9yZSBLaXRLYXQpXHJcblx0XHRcdC8vIGR1ZSB0byBidWdzIHJlbGF0ZWQgdG8gcG9zaXRpb246Zml4ZWRcclxuXHRcdFx0Ly8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MTg0NTczL3BpY2stdXAtdGhlLWFuZHJvaWQtdmVyc2lvbi1pbi10aGUtYnJvd3Nlci1ieS1qYXZhc2NyaXB0XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgbWF0Y2ggPSB1YS5tYXRjaCgvQW5kcm9pZFxccyhbMC05XFwuXSopLyk7XHJcblx0XHRcdHZhciBhbmRyb2lkdmVyc2lvbiA9ICBtYXRjaCA/IG1hdGNoWzFdIDogMDtcclxuXHRcdFx0YW5kcm9pZHZlcnNpb24gPSBwYXJzZUZsb2F0KGFuZHJvaWR2ZXJzaW9uKTtcclxuXHRcdFx0aWYoYW5kcm9pZHZlcnNpb24gPj0gMSApIHtcclxuXHRcdFx0XHRpZihhbmRyb2lkdmVyc2lvbiA8IDQuNCkge1xyXG5cdFx0XHRcdFx0ZmVhdHVyZXMuaXNPbGRBbmRyb2lkID0gdHJ1ZTsgLy8gZm9yIGZpeGVkIHBvc2l0aW9uIGJ1ZyAmIHBlcmZvcm1hbmNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZlYXR1cmVzLmFuZHJvaWRWZXJzaW9uID0gYW5kcm9pZHZlcnNpb247IC8vIGZvciB0b3VjaGVuZCBidWdcclxuXHRcdFx0fVx0XHJcblx0XHRcdGZlYXR1cmVzLmlzTW9iaWxlT3BlcmEgPSAvb3BlcmEgbWluaXxvcGVyYSBtb2JpL2kudGVzdCh1YSk7XHJcblxyXG5cdFx0XHQvLyBwLnMuIHllcywgeWVzLCBVQSBzbmlmZmluZyBpcyBiYWQsIHByb3Bvc2UgeW91ciBzb2x1dGlvbiBmb3IgYWJvdmUgYnVncy5cclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0dmFyIHN0eWxlQ2hlY2tzID0gWyd0cmFuc2Zvcm0nLCAncGVyc3BlY3RpdmUnLCAnYW5pbWF0aW9uTmFtZSddLFxyXG5cdFx0XHR2ZW5kb3JzID0gWycnLCAnd2Via2l0JywnTW96JywnbXMnLCdPJ10sXHJcblx0XHRcdHN0eWxlQ2hlY2tJdGVtLFxyXG5cdFx0XHRzdHlsZU5hbWU7XHJcblxyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xyXG5cdFx0XHR2ZW5kb3IgPSB2ZW5kb3JzW2ldO1xyXG5cclxuXHRcdFx0Zm9yKHZhciBhID0gMDsgYSA8IDM7IGErKykge1xyXG5cdFx0XHRcdHN0eWxlQ2hlY2tJdGVtID0gc3R5bGVDaGVja3NbYV07XHJcblxyXG5cdFx0XHRcdC8vIHVwcGVyY2FzZSBmaXJzdCBsZXR0ZXIgb2YgcHJvcGVydHkgbmFtZSwgaWYgdmVuZG9yIGlzIHByZXNlbnRcclxuXHRcdFx0XHRzdHlsZU5hbWUgPSB2ZW5kb3IgKyAodmVuZG9yID8gXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3R5bGVDaGVja0l0ZW0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHlsZUNoZWNrSXRlbS5zbGljZSgxKSA6IFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlQ2hlY2tJdGVtKTtcclxuXHRcdFx0XHJcblx0XHRcdFx0aWYoIWZlYXR1cmVzW3N0eWxlQ2hlY2tJdGVtXSAmJiBzdHlsZU5hbWUgaW4gaGVscGVyU3R5bGUgKSB7XHJcblx0XHRcdFx0XHRmZWF0dXJlc1tzdHlsZUNoZWNrSXRlbV0gPSBzdHlsZU5hbWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZih2ZW5kb3IgJiYgIWZlYXR1cmVzLnJhZikge1xyXG5cdFx0XHRcdHZlbmRvciA9IHZlbmRvci50b0xvd2VyQ2FzZSgpO1xyXG5cdFx0XHRcdGZlYXR1cmVzLnJhZiA9IHdpbmRvd1t2ZW5kb3IrJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xyXG5cdFx0XHRcdGlmKGZlYXR1cmVzLnJhZikge1xyXG5cdFx0XHRcdFx0ZmVhdHVyZXMuY2FmID0gd2luZG93W3ZlbmRvcisnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXSB8fCBcclxuXHRcdFx0XHRcdFx0XHRcdFx0d2luZG93W3ZlbmRvcisnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRcdFxyXG5cdFx0aWYoIWZlYXR1cmVzLnJhZikge1xyXG5cdFx0XHR2YXIgbGFzdFRpbWUgPSAwO1xyXG5cdFx0XHRmZWF0dXJlcy5yYWYgPSBmdW5jdGlvbihmbikge1xyXG5cdFx0XHRcdHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cdFx0XHRcdHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xyXG5cdFx0XHRcdHZhciBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBmbihjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LCB0aW1lVG9DYWxsKTtcclxuXHRcdFx0XHRsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcclxuXHRcdFx0XHRyZXR1cm4gaWQ7XHJcblx0XHRcdH07XHJcblx0XHRcdGZlYXR1cmVzLmNhZiA9IGZ1bmN0aW9uKGlkKSB7IGNsZWFyVGltZW91dChpZCk7IH07XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gRGV0ZWN0IFNWRyBzdXBwb3J0XHJcblx0XHRmZWF0dXJlcy5zdmcgPSAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiBcclxuXHRcdFx0XHRcdFx0ISFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3N2ZycpLmNyZWF0ZVNWR1JlY3Q7XHJcblxyXG5cdFx0ZnJhbWV3b3JrLmZlYXR1cmVzID0gZmVhdHVyZXM7XHJcblxyXG5cdFx0cmV0dXJuIGZlYXR1cmVzO1xyXG5cdH1cclxufTtcclxuXHJcbmZyYW1ld29yay5kZXRlY3RGZWF0dXJlcygpO1xyXG5cclxuLy8gT3ZlcnJpZGUgYWRkRXZlbnRMaXN0ZW5lciBmb3Igb2xkIHZlcnNpb25zIG9mIElFXHJcbmlmKGZyYW1ld29yay5mZWF0dXJlcy5vbGRJRSkge1xyXG5cclxuXHRmcmFtZXdvcmsuYmluZCA9IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIsIHVuYmluZCkge1xyXG5cdFx0XHJcblx0XHR0eXBlID0gdHlwZS5zcGxpdCgnICcpO1xyXG5cclxuXHRcdHZhciBtZXRob2ROYW1lID0gKHVuYmluZCA/ICdkZXRhY2gnIDogJ2F0dGFjaCcpICsgJ0V2ZW50JyxcclxuXHRcdFx0ZXZOYW1lLFxyXG5cdFx0XHRfaGFuZGxlRXYgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRsaXN0ZW5lci5oYW5kbGVFdmVudC5jYWxsKGxpc3RlbmVyKTtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRldk5hbWUgPSB0eXBlW2ldO1xyXG5cdFx0XHRpZihldk5hbWUpIHtcclxuXHJcblx0XHRcdFx0aWYodHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0JyAmJiBsaXN0ZW5lci5oYW5kbGVFdmVudCkge1xyXG5cdFx0XHRcdFx0aWYoIXVuYmluZCkge1xyXG5cdFx0XHRcdFx0XHRsaXN0ZW5lclsnb2xkSUUnICsgZXZOYW1lXSA9IF9oYW5kbGVFdjtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGlmKCFsaXN0ZW5lclsnb2xkSUUnICsgZXZOYW1lXSkge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHRhcmdldFttZXRob2ROYW1lXSggJ29uJyArIGV2TmFtZSwgbGlzdGVuZXJbJ29sZElFJyArIGV2TmFtZV0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0YXJnZXRbbWV0aG9kTmFtZV0oICdvbicgKyBldk5hbWUsIGxpc3RlbmVyKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHRcclxufVxyXG5cclxuLyo+PmZyYW1ld29yay1icmlkZ2UqL1xyXG5cclxuLyo+PmNvcmUqL1xyXG4vL2Z1bmN0aW9uKHRlbXBsYXRlLCBVaUNsYXNzLCBpdGVtcywgb3B0aW9ucylcclxuXHJcbnZhciBzZWxmID0gdGhpcztcclxuXHJcbi8qKlxyXG4gKiBTdGF0aWMgdmFycywgZG9uJ3QgY2hhbmdlIHVubGVzcyB5b3Uga25vdyB3aGF0IHlvdSdyZSBkb2luZy5cclxuICovXHJcbnZhciBET1VCTEVfVEFQX1JBRElVUyA9IDI1LCBcclxuXHROVU1fSE9MREVSUyA9IDM7XHJcblxyXG4vKipcclxuICogT3B0aW9uc1xyXG4gKi9cclxudmFyIF9vcHRpb25zID0ge1xyXG5cdGFsbG93UGFuVG9OZXh0OnRydWUsXHJcblx0c3BhY2luZzogMC4xMixcclxuXHRiZ09wYWNpdHk6IDEsXHJcblx0bW91c2VVc2VkOiBmYWxzZSxcclxuXHRsb29wOiB0cnVlLFxyXG5cdHBpbmNoVG9DbG9zZTogdHJ1ZSxcclxuXHRjbG9zZU9uU2Nyb2xsOiB0cnVlLFxyXG5cdGNsb3NlT25WZXJ0aWNhbERyYWc6IHRydWUsXHJcblx0dmVydGljYWxEcmFnUmFuZ2U6IDAuNzUsXHJcblx0aGlkZUFuaW1hdGlvbkR1cmF0aW9uOiAzMzMsXHJcblx0c2hvd0FuaW1hdGlvbkR1cmF0aW9uOiAzMzMsXHJcblx0c2hvd0hpZGVPcGFjaXR5OiBmYWxzZSxcclxuXHRmb2N1czogdHJ1ZSxcclxuXHRlc2NLZXk6IHRydWUsXHJcblx0YXJyb3dLZXlzOiB0cnVlLFxyXG5cdG1haW5TY3JvbGxFbmRGcmljdGlvbjogMC4zNSxcclxuXHRwYW5FbmRGcmljdGlvbjogMC4zNSxcclxuXHRpc0NsaWNrYWJsZUVsZW1lbnQ6IGZ1bmN0aW9uKGVsKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsLnRhZ05hbWUgPT09ICdBJztcclxuICAgIH0sXHJcbiAgICBnZXREb3VibGVUYXBab29tOiBmdW5jdGlvbihpc01vdXNlQ2xpY2ssIGl0ZW0pIHtcclxuICAgIFx0aWYoaXNNb3VzZUNsaWNrKSB7XHJcbiAgICBcdFx0cmV0dXJuIDE7XHJcbiAgICBcdH0gZWxzZSB7XHJcbiAgICBcdFx0cmV0dXJuIGl0ZW0uaW5pdGlhbFpvb21MZXZlbCA8IDAuNyA/IDEgOiAxLjMzO1xyXG4gICAgXHR9XHJcbiAgICB9LFxyXG4gICAgbWF4U3ByZWFkWm9vbTogMS4zMyxcclxuXHRtb2RhbDogdHJ1ZSxcclxuXHJcblx0Ly8gbm90IGZ1bGx5IGltcGxlbWVudGVkIHlldFxyXG5cdHNjYWxlTW9kZTogJ2ZpdCcgLy8gVE9ET1xyXG59O1xyXG5mcmFtZXdvcmsuZXh0ZW5kKF9vcHRpb25zLCBvcHRpb25zKTtcclxuXHJcblxyXG4vKipcclxuICogUHJpdmF0ZSBoZWxwZXIgdmFyaWFibGVzICYgZnVuY3Rpb25zXHJcbiAqL1xyXG5cclxudmFyIF9nZXRFbXB0eVBvaW50ID0gZnVuY3Rpb24oKSB7IFxyXG5cdFx0cmV0dXJuIHt4OjAseTowfTsgXHJcblx0fTtcclxuXHJcbnZhciBfaXNPcGVuLFxyXG5cdF9pc0Rlc3Ryb3lpbmcsXHJcblx0X2Nsb3NlZEJ5U2Nyb2xsLFxyXG5cdF9jdXJyZW50SXRlbUluZGV4LFxyXG5cdF9jb250YWluZXJTdHlsZSxcclxuXHRfY29udGFpbmVyU2hpZnRJbmRleCxcclxuXHRfY3VyclBhbkRpc3QgPSBfZ2V0RW1wdHlQb2ludCgpLFxyXG5cdF9zdGFydFBhbk9mZnNldCA9IF9nZXRFbXB0eVBvaW50KCksXHJcblx0X3Bhbk9mZnNldCA9IF9nZXRFbXB0eVBvaW50KCksXHJcblx0X3VwTW92ZUV2ZW50cywgLy8gZHJhZyBtb3ZlLCBkcmFnIGVuZCAmIGRyYWcgY2FuY2VsIGV2ZW50cyBhcnJheVxyXG5cdF9kb3duRXZlbnRzLCAvLyBkcmFnIHN0YXJ0IGV2ZW50cyBhcnJheVxyXG5cdF9nbG9iYWxFdmVudEhhbmRsZXJzLFxyXG5cdF92aWV3cG9ydFNpemUgPSB7fSxcclxuXHRfY3Vyclpvb21MZXZlbCxcclxuXHRfc3RhcnRab29tTGV2ZWwsXHJcblx0X3RyYW5zbGF0ZVByZWZpeCxcclxuXHRfdHJhbnNsYXRlU3VmaXgsXHJcblx0X3VwZGF0ZVNpemVJbnRlcnZhbCxcclxuXHRfaXRlbXNOZWVkVXBkYXRlLFxyXG5cdF9jdXJyUG9zaXRpb25JbmRleCA9IDAsXHJcblx0X29mZnNldCA9IHt9LFxyXG5cdF9zbGlkZVNpemUgPSBfZ2V0RW1wdHlQb2ludCgpLCAvLyBzaXplIG9mIHNsaWRlIGFyZWEsIGluY2x1ZGluZyBzcGFjaW5nXHJcblx0X2l0ZW1Ib2xkZXJzLFxyXG5cdF9wcmV2SXRlbUluZGV4LFxyXG5cdF9pbmRleERpZmYgPSAwLCAvLyBkaWZmZXJlbmNlIG9mIGluZGV4ZXMgc2luY2UgbGFzdCBjb250ZW50IHVwZGF0ZVxyXG5cdF9kcmFnU3RhcnRFdmVudCxcclxuXHRfZHJhZ01vdmVFdmVudCxcclxuXHRfZHJhZ0VuZEV2ZW50LFxyXG5cdF9kcmFnQ2FuY2VsRXZlbnQsXHJcblx0X3RyYW5zZm9ybUtleSxcclxuXHRfcG9pbnRlckV2ZW50RW5hYmxlZCxcclxuXHRfaXNGaXhlZFBvc2l0aW9uID0gdHJ1ZSxcclxuXHRfbGlrZWx5VG91Y2hEZXZpY2UsXHJcblx0X21vZHVsZXMgPSBbXSxcclxuXHRfcmVxdWVzdEFGLFxyXG5cdF9jYW5jZWxBRixcclxuXHRfaW5pdGFsQ2xhc3NOYW1lLFxyXG5cdF9pbml0YWxXaW5kb3dTY3JvbGxZLFxyXG5cdF9vbGRJRSxcclxuXHRfY3VycmVudFdpbmRvd1Njcm9sbFksXHJcblx0X2ZlYXR1cmVzLFxyXG5cdF93aW5kb3dWaXNpYmxlU2l6ZSA9IHt9LFxyXG5cdF9yZW5kZXJNYXhSZXNvbHV0aW9uID0gZmFsc2UsXHJcblxyXG5cdC8vIFJlZ2lzdGVycyBQaG90b1NXaXBlIG1vZHVsZSAoSGlzdG9yeSwgQ29udHJvbGxlciAuLi4pXHJcblx0X3JlZ2lzdGVyTW9kdWxlID0gZnVuY3Rpb24obmFtZSwgbW9kdWxlKSB7XHJcblx0XHRmcmFtZXdvcmsuZXh0ZW5kKHNlbGYsIG1vZHVsZS5wdWJsaWNNZXRob2RzKTtcclxuXHRcdF9tb2R1bGVzLnB1c2gobmFtZSk7XHJcblx0fSxcclxuXHJcblx0X2dldExvb3BlZElkID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuXHRcdHZhciBudW1TbGlkZXMgPSBfZ2V0TnVtSXRlbXMoKTtcclxuXHRcdGlmKGluZGV4ID4gbnVtU2xpZGVzIC0gMSkge1xyXG5cdFx0XHRyZXR1cm4gaW5kZXggLSBudW1TbGlkZXM7XHJcblx0XHR9IGVsc2UgIGlmKGluZGV4IDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gbnVtU2xpZGVzICsgaW5kZXg7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gaW5kZXg7XHJcblx0fSxcclxuXHRcclxuXHQvLyBNaWNybyBiaW5kL3RyaWdnZXJcclxuXHRfbGlzdGVuZXJzID0ge30sXHJcblx0X2xpc3RlbiA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XHJcblx0XHRpZighX2xpc3RlbmVyc1tuYW1lXSkge1xyXG5cdFx0XHRfbGlzdGVuZXJzW25hbWVdID0gW107XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gX2xpc3RlbmVyc1tuYW1lXS5wdXNoKGZuKTtcclxuXHR9LFxyXG5cdF9zaG91dCA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuXHRcdHZhciBsaXN0ZW5lcnMgPSBfbGlzdGVuZXJzW25hbWVdO1xyXG5cclxuXHRcdGlmKGxpc3RlbmVycykge1xyXG5cdFx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblx0XHRcdGFyZ3Muc2hpZnQoKTtcclxuXHJcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsaXN0ZW5lcnNbaV0uYXBwbHkoc2VsZiwgYXJncyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfZ2V0Q3VycmVudFRpbWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHR9LFxyXG5cdF9hcHBseUJnT3BhY2l0eSA9IGZ1bmN0aW9uKG9wYWNpdHkpIHtcclxuXHRcdF9iZ09wYWNpdHkgPSBvcGFjaXR5O1xyXG5cdFx0c2VsZi5iZy5zdHlsZS5vcGFjaXR5ID0gb3BhY2l0eSAqIF9vcHRpb25zLmJnT3BhY2l0eTtcclxuXHR9LFxyXG5cclxuXHRfYXBwbHlab29tVHJhbnNmb3JtID0gZnVuY3Rpb24oc3R5bGVPYmoseCx5LHpvb20saXRlbSkge1xyXG5cdFx0aWYoIV9yZW5kZXJNYXhSZXNvbHV0aW9uIHx8IChpdGVtICYmIGl0ZW0gIT09IHNlbGYuY3Vyckl0ZW0pICkge1xyXG5cdFx0XHR6b29tID0gem9vbSAvIChpdGVtID8gaXRlbS5maXRSYXRpbyA6IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pO1x0XHJcblx0XHR9XHJcblx0XHRcdFxyXG5cdFx0c3R5bGVPYmpbX3RyYW5zZm9ybUtleV0gPSBfdHJhbnNsYXRlUHJlZml4ICsgeCArICdweCwgJyArIHkgKyAncHgnICsgX3RyYW5zbGF0ZVN1Zml4ICsgJyBzY2FsZSgnICsgem9vbSArICcpJztcclxuXHR9LFxyXG5cdF9hcHBseUN1cnJlbnRab29tUGFuID0gZnVuY3Rpb24oIGFsbG93UmVuZGVyUmVzb2x1dGlvbiApIHtcclxuXHRcdGlmKF9jdXJyWm9vbUVsZW1lbnRTdHlsZSkge1xyXG5cclxuXHRcdFx0aWYoYWxsb3dSZW5kZXJSZXNvbHV0aW9uKSB7XHJcblx0XHRcdFx0aWYoX2N1cnJab29tTGV2ZWwgPiBzZWxmLmN1cnJJdGVtLmZpdFJhdGlvKSB7XHJcblx0XHRcdFx0XHRpZighX3JlbmRlck1heFJlc29sdXRpb24pIHtcclxuXHRcdFx0XHRcdFx0X3NldEltYWdlU2l6ZShzZWxmLmN1cnJJdGVtLCBmYWxzZSwgdHJ1ZSk7XHJcblx0XHRcdFx0XHRcdF9yZW5kZXJNYXhSZXNvbHV0aW9uID0gdHJ1ZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0aWYoX3JlbmRlck1heFJlc29sdXRpb24pIHtcclxuXHRcdFx0XHRcdFx0X3NldEltYWdlU2l6ZShzZWxmLmN1cnJJdGVtKTtcclxuXHRcdFx0XHRcdFx0X3JlbmRlck1heFJlc29sdXRpb24gPSBmYWxzZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblxyXG5cdFx0XHRfYXBwbHlab29tVHJhbnNmb3JtKF9jdXJyWm9vbUVsZW1lbnRTdHlsZSwgX3Bhbk9mZnNldC54LCBfcGFuT2Zmc2V0LnksIF9jdXJyWm9vbUxldmVsKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cdF9hcHBseVpvb21QYW5Ub0l0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XHJcblx0XHRpZihpdGVtLmNvbnRhaW5lcikge1xyXG5cclxuXHRcdFx0X2FwcGx5Wm9vbVRyYW5zZm9ybShpdGVtLmNvbnRhaW5lci5zdHlsZSwgXHJcblx0XHRcdFx0XHRcdFx0XHRpdGVtLmluaXRpYWxQb3NpdGlvbi54LCBcclxuXHRcdFx0XHRcdFx0XHRcdGl0ZW0uaW5pdGlhbFBvc2l0aW9uLnksIFxyXG5cdFx0XHRcdFx0XHRcdFx0aXRlbS5pbml0aWFsWm9vbUxldmVsLFxyXG5cdFx0XHRcdFx0XHRcdFx0aXRlbSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHRfc2V0VHJhbnNsYXRlWCA9IGZ1bmN0aW9uKHgsIGVsU3R5bGUpIHtcclxuXHRcdGVsU3R5bGVbX3RyYW5zZm9ybUtleV0gPSBfdHJhbnNsYXRlUHJlZml4ICsgeCArICdweCwgMHB4JyArIF90cmFuc2xhdGVTdWZpeDtcclxuXHR9LFxyXG5cdF9tb3ZlTWFpblNjcm9sbCA9IGZ1bmN0aW9uKHgsIGRyYWdnaW5nKSB7XHJcblxyXG5cdFx0aWYoIV9vcHRpb25zLmxvb3AgJiYgZHJhZ2dpbmcpIHtcclxuXHRcdFx0dmFyIG5ld1NsaWRlSW5kZXhPZmZzZXQgPSBfY3VycmVudEl0ZW1JbmRleCArIChfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXggLSB4KSAvIF9zbGlkZVNpemUueCxcclxuXHRcdFx0XHRkZWx0YSA9IE1hdGgucm91bmQoeCAtIF9tYWluU2Nyb2xsUG9zLngpO1xyXG5cclxuXHRcdFx0aWYoIChuZXdTbGlkZUluZGV4T2Zmc2V0IDwgMCAmJiBkZWx0YSA+IDApIHx8IFxyXG5cdFx0XHRcdChuZXdTbGlkZUluZGV4T2Zmc2V0ID49IF9nZXROdW1JdGVtcygpIC0gMSAmJiBkZWx0YSA8IDApICkge1xyXG5cdFx0XHRcdHggPSBfbWFpblNjcm9sbFBvcy54ICsgZGVsdGEgKiBfb3B0aW9ucy5tYWluU2Nyb2xsRW5kRnJpY3Rpb247XHJcblx0XHRcdH0gXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdF9tYWluU2Nyb2xsUG9zLnggPSB4O1xyXG5cdFx0X3NldFRyYW5zbGF0ZVgoeCwgX2NvbnRhaW5lclN0eWxlKTtcclxuXHR9LFxyXG5cdF9jYWxjdWxhdGVQYW5PZmZzZXQgPSBmdW5jdGlvbihheGlzLCB6b29tTGV2ZWwpIHtcclxuXHRcdHZhciBtID0gX21pZFpvb21Qb2ludFtheGlzXSAtIF9vZmZzZXRbYXhpc107XHJcblx0XHRyZXR1cm4gX3N0YXJ0UGFuT2Zmc2V0W2F4aXNdICsgX2N1cnJQYW5EaXN0W2F4aXNdICsgbSAtIG0gKiAoIHpvb21MZXZlbCAvIF9zdGFydFpvb21MZXZlbCApO1xyXG5cdH0sXHJcblx0XHJcblx0X2VxdWFsaXplUG9pbnRzID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcblx0XHRwMS54ID0gcDIueDtcclxuXHRcdHAxLnkgPSBwMi55O1xyXG5cdFx0aWYocDIuaWQpIHtcclxuXHRcdFx0cDEuaWQgPSBwMi5pZDtcclxuXHRcdH1cclxuXHR9LFxyXG5cdF9yb3VuZFBvaW50ID0gZnVuY3Rpb24ocCkge1xyXG5cdFx0cC54ID0gTWF0aC5yb3VuZChwLngpO1xyXG5cdFx0cC55ID0gTWF0aC5yb3VuZChwLnkpO1xyXG5cdH0sXHJcblxyXG5cdF9tb3VzZU1vdmVUaW1lb3V0ID0gbnVsbCxcclxuXHRfb25GaXJzdE1vdXNlTW92ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly8gV2FpdCB1bnRpbCBtb3VzZSBtb3ZlIGV2ZW50IGlzIGZpcmVkIGF0IGxlYXN0IHR3aWNlIGR1cmluZyAxMDBtc1xyXG5cdFx0Ly8gV2UgZG8gdGhpcywgYmVjYXVzZSBzb21lIG1vYmlsZSBicm93c2VycyB0cmlnZ2VyIGl0IG9uIHRvdWNoc3RhcnRcclxuXHRcdGlmKF9tb3VzZU1vdmVUaW1lb3V0ICkgeyBcclxuXHRcdFx0ZnJhbWV3b3JrLnVuYmluZChkb2N1bWVudCwgJ21vdXNlbW92ZScsIF9vbkZpcnN0TW91c2VNb3ZlKTtcclxuXHRcdFx0ZnJhbWV3b3JrLmFkZENsYXNzKHRlbXBsYXRlLCAncHN3cC0taGFzX21vdXNlJyk7XHJcblx0XHRcdF9vcHRpb25zLm1vdXNlVXNlZCA9IHRydWU7XHJcblx0XHRcdF9zaG91dCgnbW91c2VVc2VkJyk7XHJcblx0XHR9XHJcblx0XHRfbW91c2VNb3ZlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdF9tb3VzZU1vdmVUaW1lb3V0ID0gbnVsbDtcclxuXHRcdH0sIDEwMCk7XHJcblx0fSxcclxuXHJcblx0X2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCAna2V5ZG93bicsIHNlbGYpO1xyXG5cclxuXHRcdGlmKF9mZWF0dXJlcy50cmFuc2Zvcm0pIHtcclxuXHRcdFx0Ly8gZG9uJ3QgYmluZCBjbGljayBldmVudCBpbiBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgdHJhbnNmb3JtIChtb3N0bHkgSUU4KVxyXG5cdFx0XHRmcmFtZXdvcmsuYmluZChzZWxmLnNjcm9sbFdyYXAsICdjbGljaycsIHNlbGYpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblxyXG5cdFx0aWYoIV9vcHRpb25zLm1vdXNlVXNlZCkge1xyXG5cdFx0XHRmcmFtZXdvcmsuYmluZChkb2N1bWVudCwgJ21vdXNlbW92ZScsIF9vbkZpcnN0TW91c2VNb3ZlKTtcclxuXHRcdH1cclxuXHJcblx0XHRmcmFtZXdvcmsuYmluZCh3aW5kb3csICdyZXNpemUgc2Nyb2xsJywgc2VsZik7XHJcblxyXG5cdFx0X3Nob3V0KCdiaW5kRXZlbnRzJyk7XHJcblx0fSxcclxuXHJcblx0X3VuYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0ZnJhbWV3b3JrLnVuYmluZCh3aW5kb3csICdyZXNpemUnLCBzZWxmKTtcclxuXHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCAnc2Nyb2xsJywgX2dsb2JhbEV2ZW50SGFuZGxlcnMuc2Nyb2xsKTtcclxuXHRcdGZyYW1ld29yay51bmJpbmQoZG9jdW1lbnQsICdrZXlkb3duJywgc2VsZik7XHJcblx0XHRmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX29uRmlyc3RNb3VzZU1vdmUpO1xyXG5cclxuXHRcdGlmKF9mZWF0dXJlcy50cmFuc2Zvcm0pIHtcclxuXHRcdFx0ZnJhbWV3b3JrLnVuYmluZChzZWxmLnNjcm9sbFdyYXAsICdjbGljaycsIHNlbGYpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKF9pc0RyYWdnaW5nKSB7XHJcblx0XHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCBfdXBNb3ZlRXZlbnRzLCBzZWxmKTtcclxuXHRcdH1cclxuXHJcblx0XHRfc2hvdXQoJ3VuYmluZEV2ZW50cycpO1xyXG5cdH0sXHJcblx0XHJcblx0X2NhbGN1bGF0ZVBhbkJvdW5kcyA9IGZ1bmN0aW9uKHpvb21MZXZlbCwgdXBkYXRlKSB7XHJcblx0XHR2YXIgYm91bmRzID0gX2NhbGN1bGF0ZUl0ZW1TaXplKCBzZWxmLmN1cnJJdGVtLCBfdmlld3BvcnRTaXplLCB6b29tTGV2ZWwgKTtcclxuXHRcdGlmKHVwZGF0ZSkge1xyXG5cdFx0XHRfY3VyclBhbkJvdW5kcyA9IGJvdW5kcztcclxuXHRcdH1cclxuXHRcdHJldHVybiBib3VuZHM7XHJcblx0fSxcclxuXHRcclxuXHRfZ2V0TWluWm9vbUxldmVsID0gZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0aWYoIWl0ZW0pIHtcclxuXHRcdFx0aXRlbSA9IHNlbGYuY3Vyckl0ZW07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gaXRlbS5pbml0aWFsWm9vbUxldmVsO1xyXG5cdH0sXHJcblx0X2dldE1heFpvb21MZXZlbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHRcdGlmKCFpdGVtKSB7XHJcblx0XHRcdGl0ZW0gPSBzZWxmLmN1cnJJdGVtO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGl0ZW0udyA+IDAgPyBfb3B0aW9ucy5tYXhTcHJlYWRab29tIDogMTtcclxuXHR9LFxyXG5cclxuXHQvLyBSZXR1cm4gdHJ1ZSBpZiBvZmZzZXQgaXMgb3V0IG9mIHRoZSBib3VuZHNcclxuXHRfbW9kaWZ5RGVzdFBhbk9mZnNldCA9IGZ1bmN0aW9uKGF4aXMsIGRlc3RQYW5Cb3VuZHMsIGRlc3RQYW5PZmZzZXQsIGRlc3Rab29tTGV2ZWwpIHtcclxuXHRcdGlmKGRlc3Rab29tTGV2ZWwgPT09IHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCkge1xyXG5cdFx0XHRkZXN0UGFuT2Zmc2V0W2F4aXNdID0gc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb25bYXhpc107XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0ZGVzdFBhbk9mZnNldFtheGlzXSA9IF9jYWxjdWxhdGVQYW5PZmZzZXQoYXhpcywgZGVzdFpvb21MZXZlbCk7IFxyXG5cclxuXHRcdFx0aWYoZGVzdFBhbk9mZnNldFtheGlzXSA+IGRlc3RQYW5Cb3VuZHMubWluW2F4aXNdKSB7XHJcblx0XHRcdFx0ZGVzdFBhbk9mZnNldFtheGlzXSA9IGRlc3RQYW5Cb3VuZHMubWluW2F4aXNdO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9IGVsc2UgaWYoZGVzdFBhbk9mZnNldFtheGlzXSA8IGRlc3RQYW5Cb3VuZHMubWF4W2F4aXNdICkge1xyXG5cdFx0XHRcdGRlc3RQYW5PZmZzZXRbYXhpc10gPSBkZXN0UGFuQm91bmRzLm1heFtheGlzXTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH0sXHJcblxyXG5cdF9zZXR1cFRyYW5zZm9ybXMgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRpZihfdHJhbnNmb3JtS2V5KSB7XHJcblx0XHRcdC8vIHNldHVwIDNkIHRyYW5zZm9ybXNcclxuXHRcdFx0dmFyIGFsbG93M2RUcmFuc2Zvcm0gPSBfZmVhdHVyZXMucGVyc3BlY3RpdmUgJiYgIV9saWtlbHlUb3VjaERldmljZTtcclxuXHRcdFx0X3RyYW5zbGF0ZVByZWZpeCA9ICd0cmFuc2xhdGUnICsgKGFsbG93M2RUcmFuc2Zvcm0gPyAnM2QoJyA6ICcoJyk7XHJcblx0XHRcdF90cmFuc2xhdGVTdWZpeCA9IF9mZWF0dXJlcy5wZXJzcGVjdGl2ZSA/ICcsIDBweCknIDogJyknO1x0XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBPdmVycmlkZSB6b29tL3Bhbi9tb3ZlIGZ1bmN0aW9ucyBpbiBjYXNlIG9sZCBicm93c2VyIGlzIHVzZWQgKG1vc3QgbGlrZWx5IElFKVxyXG5cdFx0Ly8gKHNvIHRoZXkgdXNlIGxlZnQvdG9wL3dpZHRoL2hlaWdodCwgaW5zdGVhZCBvZiBDU1MgdHJhbnNmb3JtKVxyXG5cdFxyXG5cdFx0X3RyYW5zZm9ybUtleSA9ICdsZWZ0JztcclxuXHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWllJyk7XHJcblxyXG5cdFx0X3NldFRyYW5zbGF0ZVggPSBmdW5jdGlvbih4LCBlbFN0eWxlKSB7XHJcblx0XHRcdGVsU3R5bGUubGVmdCA9IHggKyAncHgnO1xyXG5cdFx0fTtcclxuXHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XHJcblxyXG5cdFx0XHR2YXIgem9vbVJhdGlvID0gaXRlbS5maXRSYXRpbyA+IDEgPyAxIDogaXRlbS5maXRSYXRpbyxcclxuXHRcdFx0XHRzID0gaXRlbS5jb250YWluZXIuc3R5bGUsXHJcblx0XHRcdFx0dyA9IHpvb21SYXRpbyAqIGl0ZW0udyxcclxuXHRcdFx0XHRoID0gem9vbVJhdGlvICogaXRlbS5oO1xyXG5cclxuXHRcdFx0cy53aWR0aCA9IHcgKyAncHgnO1xyXG5cdFx0XHRzLmhlaWdodCA9IGggKyAncHgnO1xyXG5cdFx0XHRzLmxlZnQgPSBpdGVtLmluaXRpYWxQb3NpdGlvbi54ICsgJ3B4JztcclxuXHRcdFx0cy50b3AgPSBpdGVtLmluaXRpYWxQb3NpdGlvbi55ICsgJ3B4JztcclxuXHJcblx0XHR9O1xyXG5cdFx0X2FwcGx5Q3VycmVudFpvb21QYW4gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYoX2N1cnJab29tRWxlbWVudFN0eWxlKSB7XHJcblxyXG5cdFx0XHRcdHZhciBzID0gX2N1cnJab29tRWxlbWVudFN0eWxlLFxyXG5cdFx0XHRcdFx0aXRlbSA9IHNlbGYuY3Vyckl0ZW0sXHJcblx0XHRcdFx0XHR6b29tUmF0aW8gPSBpdGVtLmZpdFJhdGlvID4gMSA/IDEgOiBpdGVtLmZpdFJhdGlvLFxyXG5cdFx0XHRcdFx0dyA9IHpvb21SYXRpbyAqIGl0ZW0udyxcclxuXHRcdFx0XHRcdGggPSB6b29tUmF0aW8gKiBpdGVtLmg7XHJcblxyXG5cdFx0XHRcdHMud2lkdGggPSB3ICsgJ3B4JztcclxuXHRcdFx0XHRzLmhlaWdodCA9IGggKyAncHgnO1xyXG5cclxuXHJcblx0XHRcdFx0cy5sZWZ0ID0gX3Bhbk9mZnNldC54ICsgJ3B4JztcclxuXHRcdFx0XHRzLnRvcCA9IF9wYW5PZmZzZXQueSArICdweCc7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9O1xyXG5cdH0sXHJcblxyXG5cdF9vbktleURvd24gPSBmdW5jdGlvbihlKSB7XHJcblx0XHR2YXIga2V5ZG93bkFjdGlvbiA9ICcnO1xyXG5cdFx0aWYoX29wdGlvbnMuZXNjS2V5ICYmIGUua2V5Q29kZSA9PT0gMjcpIHsgXHJcblx0XHRcdGtleWRvd25BY3Rpb24gPSAnY2xvc2UnO1xyXG5cdFx0fSBlbHNlIGlmKF9vcHRpb25zLmFycm93S2V5cykge1xyXG5cdFx0XHRpZihlLmtleUNvZGUgPT09IDM3KSB7XHJcblx0XHRcdFx0a2V5ZG93bkFjdGlvbiA9ICdwcmV2JztcclxuXHRcdFx0fSBlbHNlIGlmKGUua2V5Q29kZSA9PT0gMzkpIHsgXHJcblx0XHRcdFx0a2V5ZG93bkFjdGlvbiA9ICduZXh0JztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmKGtleWRvd25BY3Rpb24pIHtcclxuXHRcdFx0Ly8gZG9uJ3QgZG8gYW55dGhpbmcgaWYgc3BlY2lhbCBrZXkgcHJlc3NlZCB0byBwcmV2ZW50IGZyb20gb3ZlcnJpZGluZyBkZWZhdWx0IGJyb3dzZXIgYWN0aW9uc1xyXG5cdFx0XHQvLyBlLmcuIGluIENocm9tZSBvbiBNYWMgY21kK2Fycm93LWxlZnQgcmV0dXJucyB0byBwcmV2aW91cyBwYWdlXHJcblx0XHRcdGlmKCAhZS5jdHJsS2V5ICYmICFlLmFsdEtleSAmJiAhZS5zaGlmdEtleSAmJiAhZS5tZXRhS2V5ICkge1xyXG5cdFx0XHRcdGlmKGUucHJldmVudERlZmF1bHQpIHtcclxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0ZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xyXG5cdFx0XHRcdH0gXHJcblx0XHRcdFx0c2VsZltrZXlkb3duQWN0aW9uXSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0X29uR2xvYmFsQ2xpY2sgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRpZighZSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gZG9uJ3QgYWxsb3cgY2xpY2sgZXZlbnQgdG8gcGFzcyB0aHJvdWdoIHdoZW4gdHJpZ2dlcmluZyBhZnRlciBkcmFnIG9yIHNvbWUgb3RoZXIgZ2VzdHVyZVxyXG5cdFx0aWYoX21vdmVkIHx8IF96b29tU3RhcnRlZCB8fCBfbWFpblNjcm9sbEFuaW1hdGluZyB8fCBfdmVydGljYWxEcmFnSW5pdGlhdGVkKSB7XHJcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHRfdXBkYXRlUGFnZVNjcm9sbE9mZnNldCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0c2VsZi5zZXRTY3JvbGxPZmZzZXQoMCwgZnJhbWV3b3JrLmdldFNjcm9sbFkoKSk7XHRcdFxyXG5cdH07XHJcblx0XHJcblxyXG5cclxuXHRcclxuXHJcblxyXG5cclxuLy8gTWljcm8gYW5pbWF0aW9uIGVuZ2luZVxyXG52YXIgX2FuaW1hdGlvbnMgPSB7fSxcclxuXHRfbnVtQW5pbWF0aW9ucyA9IDAsXHJcblx0X3N0b3BBbmltYXRpb24gPSBmdW5jdGlvbihuYW1lKSB7XHJcblx0XHRpZihfYW5pbWF0aW9uc1tuYW1lXSkge1xyXG5cdFx0XHRpZihfYW5pbWF0aW9uc1tuYW1lXS5yYWYpIHtcclxuXHRcdFx0XHRfY2FuY2VsQUYoIF9hbmltYXRpb25zW25hbWVdLnJhZiApO1xyXG5cdFx0XHR9XHJcblx0XHRcdF9udW1BbmltYXRpb25zLS07XHJcblx0XHRcdGRlbGV0ZSBfYW5pbWF0aW9uc1tuYW1lXTtcclxuXHRcdH1cclxuXHR9LFxyXG5cdF9yZWdpc3RlclN0YXJ0QW5pbWF0aW9uID0gZnVuY3Rpb24obmFtZSkge1xyXG5cdFx0aWYoX2FuaW1hdGlvbnNbbmFtZV0pIHtcclxuXHRcdFx0X3N0b3BBbmltYXRpb24obmFtZSk7XHJcblx0XHR9XHJcblx0XHRpZighX2FuaW1hdGlvbnNbbmFtZV0pIHtcclxuXHRcdFx0X251bUFuaW1hdGlvbnMrKztcclxuXHRcdFx0X2FuaW1hdGlvbnNbbmFtZV0gPSB7fTtcclxuXHRcdH1cclxuXHR9LFxyXG5cdF9zdG9wQWxsQW5pbWF0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBfYW5pbWF0aW9ucykge1xyXG5cclxuXHRcdFx0aWYoIF9hbmltYXRpb25zLmhhc093blByb3BlcnR5KCBwcm9wICkgKSB7XHJcblx0XHRcdFx0X3N0b3BBbmltYXRpb24ocHJvcCk7XHJcblx0XHRcdH0gXHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdH0sXHJcblx0X2FuaW1hdGVQcm9wID0gZnVuY3Rpb24obmFtZSwgYiwgZW5kUHJvcCwgZCwgZWFzaW5nRm4sIG9uVXBkYXRlLCBvbkNvbXBsZXRlKSB7XHJcblx0XHR2YXIgc3RhcnRBbmltVGltZSA9IF9nZXRDdXJyZW50VGltZSgpLCB0O1xyXG5cdFx0X3JlZ2lzdGVyU3RhcnRBbmltYXRpb24obmFtZSk7XHJcblxyXG5cdFx0dmFyIGFuaW1sb29wID0gZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYgKCBfYW5pbWF0aW9uc1tuYW1lXSApIHtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR0ID0gX2dldEN1cnJlbnRUaW1lKCkgLSBzdGFydEFuaW1UaW1lOyAvLyB0aW1lIGRpZmZcclxuXHRcdFx0XHQvL2IgLSBiZWdpbm5pbmcgKHN0YXJ0IHByb3ApXHJcblx0XHRcdFx0Ly9kIC0gYW5pbSBkdXJhdGlvblxyXG5cclxuXHRcdFx0XHRpZiAoIHQgPj0gZCApIHtcclxuXHRcdFx0XHRcdF9zdG9wQW5pbWF0aW9uKG5hbWUpO1xyXG5cdFx0XHRcdFx0b25VcGRhdGUoZW5kUHJvcCk7XHJcblx0XHRcdFx0XHRpZihvbkNvbXBsZXRlKSB7XHJcblx0XHRcdFx0XHRcdG9uQ29tcGxldGUoKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0b25VcGRhdGUoIChlbmRQcm9wIC0gYikgKiBlYXNpbmdGbih0L2QpICsgYiApO1xyXG5cclxuXHRcdFx0XHRfYW5pbWF0aW9uc1tuYW1lXS5yYWYgPSBfcmVxdWVzdEFGKGFuaW1sb29wKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHRcdGFuaW1sb29wKCk7XHJcblx0fTtcclxuXHRcclxuXHJcblxyXG52YXIgcHVibGljTWV0aG9kcyA9IHtcclxuXHJcblx0Ly8gbWFrZSBhIGZldyBsb2NhbCB2YXJpYWJsZXMgYW5kIGZ1bmN0aW9ucyBwdWJsaWNcclxuXHRzaG91dDogX3Nob3V0LFxyXG5cdGxpc3RlbjogX2xpc3RlbixcclxuXHR2aWV3cG9ydFNpemU6IF92aWV3cG9ydFNpemUsXHJcblx0b3B0aW9uczogX29wdGlvbnMsXHJcblxyXG5cdGlzTWFpblNjcm9sbEFuaW1hdGluZzogZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gX21haW5TY3JvbGxBbmltYXRpbmc7XHJcblx0fSxcclxuXHRnZXRab29tTGV2ZWw6IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIF9jdXJyWm9vbUxldmVsO1xyXG5cdH0sXHJcblx0Z2V0Q3VycmVudEluZGV4OiBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBfY3VycmVudEl0ZW1JbmRleDtcclxuXHR9LFxyXG5cdGlzRHJhZ2dpbmc6IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIF9pc0RyYWdnaW5nO1xyXG5cdH0sXHRcclxuXHRpc1pvb21pbmc6IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIF9pc1pvb21pbmc7XHJcblx0fSxcclxuXHRzZXRTY3JvbGxPZmZzZXQ6IGZ1bmN0aW9uKHgseSkge1xyXG5cdFx0X29mZnNldC54ID0geDtcclxuXHRcdF9jdXJyZW50V2luZG93U2Nyb2xsWSA9IF9vZmZzZXQueSA9IHk7XHJcblx0XHRfc2hvdXQoJ3VwZGF0ZVNjcm9sbE9mZnNldCcsIF9vZmZzZXQpO1xyXG5cdH0sXHJcblx0YXBwbHlab29tUGFuOiBmdW5jdGlvbih6b29tTGV2ZWwscGFuWCxwYW5ZLGFsbG93UmVuZGVyUmVzb2x1dGlvbikge1xyXG5cdFx0X3Bhbk9mZnNldC54ID0gcGFuWDtcclxuXHRcdF9wYW5PZmZzZXQueSA9IHBhblk7XHJcblx0XHRfY3Vyclpvb21MZXZlbCA9IHpvb21MZXZlbDtcclxuXHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCBhbGxvd1JlbmRlclJlc29sdXRpb24gKTtcclxuXHR9LFxyXG5cclxuXHRpbml0OiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRpZihfaXNPcGVuIHx8IF9pc0Rlc3Ryb3lpbmcpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBpO1xyXG5cclxuXHRcdHNlbGYuZnJhbWV3b3JrID0gZnJhbWV3b3JrOyAvLyBiYXNpYyBmdW5jdGlvbmFsaXR5XHJcblx0XHRzZWxmLnRlbXBsYXRlID0gdGVtcGxhdGU7IC8vIHJvb3QgRE9NIGVsZW1lbnQgb2YgUGhvdG9Td2lwZVxyXG5cdFx0c2VsZi5iZyA9IGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3ModGVtcGxhdGUsICdwc3dwX19iZycpO1xyXG5cclxuXHRcdF9pbml0YWxDbGFzc05hbWUgPSB0ZW1wbGF0ZS5jbGFzc05hbWU7XHJcblx0XHRfaXNPcGVuID0gdHJ1ZTtcclxuXHRcdFx0XHRcclxuXHRcdF9mZWF0dXJlcyA9IGZyYW1ld29yay5kZXRlY3RGZWF0dXJlcygpO1xyXG5cdFx0X3JlcXVlc3RBRiA9IF9mZWF0dXJlcy5yYWY7XHJcblx0XHRfY2FuY2VsQUYgPSBfZmVhdHVyZXMuY2FmO1xyXG5cdFx0X3RyYW5zZm9ybUtleSA9IF9mZWF0dXJlcy50cmFuc2Zvcm07XHJcblx0XHRfb2xkSUUgPSBfZmVhdHVyZXMub2xkSUU7XHJcblx0XHRcclxuXHRcdHNlbGYuc2Nyb2xsV3JhcCA9IGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3ModGVtcGxhdGUsICdwc3dwX19zY3JvbGwtd3JhcCcpO1xyXG5cdFx0c2VsZi5jb250YWluZXIgPSBmcmFtZXdvcmsuZ2V0Q2hpbGRCeUNsYXNzKHNlbGYuc2Nyb2xsV3JhcCwgJ3Bzd3BfX2NvbnRhaW5lcicpO1xyXG5cclxuXHRcdF9jb250YWluZXJTdHlsZSA9IHNlbGYuY29udGFpbmVyLnN0eWxlOyAvLyBmb3IgZmFzdCBhY2Nlc3NcclxuXHJcblx0XHQvLyBPYmplY3RzIHRoYXQgaG9sZCBzbGlkZXMgKHRoZXJlIGFyZSBvbmx5IDMgaW4gRE9NKVxyXG5cdFx0c2VsZi5pdGVtSG9sZGVycyA9IF9pdGVtSG9sZGVycyA9IFtcclxuXHRcdFx0e2VsOnNlbGYuY29udGFpbmVyLmNoaWxkcmVuWzBdICwgd3JhcDowLCBpbmRleDogLTF9LFxyXG5cdFx0XHR7ZWw6c2VsZi5jb250YWluZXIuY2hpbGRyZW5bMV0gLCB3cmFwOjAsIGluZGV4OiAtMX0sXHJcblx0XHRcdHtlbDpzZWxmLmNvbnRhaW5lci5jaGlsZHJlblsyXSAsIHdyYXA6MCwgaW5kZXg6IC0xfVxyXG5cdFx0XTtcclxuXHJcblx0XHQvLyBoaWRlIG5lYXJieSBpdGVtIGhvbGRlcnMgdW50aWwgaW5pdGlhbCB6b29tIGFuaW1hdGlvbiBmaW5pc2hlcyAodG8gYXZvaWQgZXh0cmEgUGFpbnRzKVxyXG5cdFx0X2l0ZW1Ib2xkZXJzWzBdLmVsLnN0eWxlLmRpc3BsYXkgPSBfaXRlbUhvbGRlcnNbMl0uZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcblx0XHRfc2V0dXBUcmFuc2Zvcm1zKCk7XHJcblxyXG5cdFx0Ly8gU2V0dXAgZ2xvYmFsIGV2ZW50c1xyXG5cdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMgPSB7XHJcblx0XHRcdHJlc2l6ZTogc2VsZi51cGRhdGVTaXplLFxyXG5cdFx0XHRzY3JvbGw6IF91cGRhdGVQYWdlU2Nyb2xsT2Zmc2V0LFxyXG5cdFx0XHRrZXlkb3duOiBfb25LZXlEb3duLFxyXG5cdFx0XHRjbGljazogX29uR2xvYmFsQ2xpY2tcclxuXHRcdH07XHJcblxyXG5cdFx0Ly8gZGlzYWJsZSBzaG93L2hpZGUgZWZmZWN0cyBvbiBvbGQgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IENTUyBhbmltYXRpb25zIG9yIHRyYW5zZm9ybXMsIFxyXG5cdFx0Ly8gb2xkIElPUywgQW5kcm9pZCBhbmQgT3BlcmEgbW9iaWxlLiBCbGFja2JlcnJ5IHNlZW1zIHRvIHdvcmsgZmluZSwgZXZlbiBvbGRlciBtb2RlbHMuXHJcblx0XHR2YXIgb2xkUGhvbmUgPSBfZmVhdHVyZXMuaXNPbGRJT1NQaG9uZSB8fCBfZmVhdHVyZXMuaXNPbGRBbmRyb2lkIHx8IF9mZWF0dXJlcy5pc01vYmlsZU9wZXJhO1xyXG5cdFx0aWYoIV9mZWF0dXJlcy5hbmltYXRpb25OYW1lIHx8ICFfZmVhdHVyZXMudHJhbnNmb3JtIHx8IG9sZFBob25lKSB7XHJcblx0XHRcdF9vcHRpb25zLnNob3dBbmltYXRpb25EdXJhdGlvbiA9IF9vcHRpb25zLmhpZGVBbmltYXRpb25EdXJhdGlvbiA9IDA7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gaW5pdCBtb2R1bGVzXHJcblx0XHRmb3IoaSA9IDA7IGkgPCBfbW9kdWxlcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRzZWxmWydpbml0JyArIF9tb2R1bGVzW2ldXSgpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBpbml0XHJcblx0XHRpZihVaUNsYXNzKSB7XHJcblx0XHRcdHZhciB1aSA9IHNlbGYudWkgPSBuZXcgVWlDbGFzcyhzZWxmLCBmcmFtZXdvcmspO1xyXG5cdFx0XHR1aS5pbml0KCk7XHJcblx0XHR9XHJcblxyXG5cdFx0X3Nob3V0KCdmaXJzdFVwZGF0ZScpO1xyXG5cdFx0X2N1cnJlbnRJdGVtSW5kZXggPSBfY3VycmVudEl0ZW1JbmRleCB8fCBfb3B0aW9ucy5pbmRleCB8fCAwO1xyXG5cdFx0Ly8gdmFsaWRhdGUgaW5kZXhcclxuXHRcdGlmKCBpc05hTihfY3VycmVudEl0ZW1JbmRleCkgfHwgX2N1cnJlbnRJdGVtSW5kZXggPCAwIHx8IF9jdXJyZW50SXRlbUluZGV4ID49IF9nZXROdW1JdGVtcygpICkge1xyXG5cdFx0XHRfY3VycmVudEl0ZW1JbmRleCA9IDA7XHJcblx0XHR9XHJcblx0XHRzZWxmLmN1cnJJdGVtID0gX2dldEl0ZW1BdCggX2N1cnJlbnRJdGVtSW5kZXggKTtcclxuXHJcblx0XHRcclxuXHRcdGlmKF9mZWF0dXJlcy5pc09sZElPU1Bob25lIHx8IF9mZWF0dXJlcy5pc09sZEFuZHJvaWQpIHtcclxuXHRcdFx0X2lzRml4ZWRQb3NpdGlvbiA9IGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHR0ZW1wbGF0ZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XHJcblx0XHRpZihfb3B0aW9ucy5tb2RhbCkge1xyXG5cdFx0XHRpZighX2lzRml4ZWRQb3NpdGlvbikge1xyXG5cdFx0XHRcdHRlbXBsYXRlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuXHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS50b3AgPSBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpICsgJ3B4JztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZihfY3VycmVudFdpbmRvd1Njcm9sbFkgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRfc2hvdXQoJ2luaXRpYWxMYXlvdXQnKTtcclxuXHRcdFx0X2N1cnJlbnRXaW5kb3dTY3JvbGxZID0gX2luaXRhbFdpbmRvd1Njcm9sbFkgPSBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBhZGQgY2xhc3NlcyB0byByb290IGVsZW1lbnQgb2YgUGhvdG9Td2lwZVxyXG5cdFx0dmFyIHJvb3RDbGFzc2VzID0gJ3Bzd3AtLW9wZW4gJztcclxuXHRcdGlmKF9vcHRpb25zLm1haW5DbGFzcykge1xyXG5cdFx0XHRyb290Q2xhc3NlcyArPSBfb3B0aW9ucy5tYWluQ2xhc3MgKyAnICc7XHJcblx0XHR9XHJcblx0XHRpZihfb3B0aW9ucy5zaG93SGlkZU9wYWNpdHkpIHtcclxuXHRcdFx0cm9vdENsYXNzZXMgKz0gJ3Bzd3AtLWFuaW1hdGVfb3BhY2l0eSAnO1xyXG5cdFx0fVxyXG5cdFx0cm9vdENsYXNzZXMgKz0gX2xpa2VseVRvdWNoRGV2aWNlID8gJ3Bzd3AtLXRvdWNoJyA6ICdwc3dwLS1ub3RvdWNoJztcclxuXHRcdHJvb3RDbGFzc2VzICs9IF9mZWF0dXJlcy5hbmltYXRpb25OYW1lID8gJyBwc3dwLS1jc3NfYW5pbWF0aW9uJyA6ICcnO1xyXG5cdFx0cm9vdENsYXNzZXMgKz0gX2ZlYXR1cmVzLnN2ZyA/ICcgcHN3cC0tc3ZnJyA6ICcnO1xyXG5cdFx0ZnJhbWV3b3JrLmFkZENsYXNzKHRlbXBsYXRlLCByb290Q2xhc3Nlcyk7XHJcblxyXG5cdFx0c2VsZi51cGRhdGVTaXplKCk7XHJcblxyXG5cdFx0Ly8gaW5pdGlhbCB1cGRhdGVcclxuXHRcdF9jb250YWluZXJTaGlmdEluZGV4ID0gLTE7XHJcblx0XHRfaW5kZXhEaWZmID0gbnVsbDtcclxuXHRcdGZvcihpID0gMDsgaSA8IE5VTV9IT0xERVJTOyBpKyspIHtcclxuXHRcdFx0X3NldFRyYW5zbGF0ZVgoIChpK19jb250YWluZXJTaGlmdEluZGV4KSAqIF9zbGlkZVNpemUueCwgX2l0ZW1Ib2xkZXJzW2ldLmVsLnN0eWxlKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZighX29sZElFKSB7XHJcblx0XHRcdGZyYW1ld29yay5iaW5kKHNlbGYuc2Nyb2xsV3JhcCwgX2Rvd25FdmVudHMsIHNlbGYpOyAvLyBubyBkcmFnZ2luZyBmb3Igb2xkIElFXHJcblx0XHR9XHRcclxuXHJcblx0XHRfbGlzdGVuKCdpbml0aWFsWm9vbUluRW5kJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdHNlbGYuc2V0Q29udGVudChfaXRlbUhvbGRlcnNbMF0sIF9jdXJyZW50SXRlbUluZGV4LTEpO1xyXG5cdFx0XHRzZWxmLnNldENvbnRlbnQoX2l0ZW1Ib2xkZXJzWzJdLCBfY3VycmVudEl0ZW1JbmRleCsxKTtcclxuXHJcblx0XHRcdF9pdGVtSG9sZGVyc1swXS5lbC5zdHlsZS5kaXNwbGF5ID0gX2l0ZW1Ib2xkZXJzWzJdLmVsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cclxuXHRcdFx0aWYoX29wdGlvbnMuZm9jdXMpIHtcclxuXHRcdFx0XHQvLyBmb2N1cyBjYXVzZXMgbGF5b3V0LCBcclxuXHRcdFx0XHQvLyB3aGljaCBjYXVzZXMgbGFnIGR1cmluZyB0aGUgYW5pbWF0aW9uLCBcclxuXHRcdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIGRlbGF5IGl0IHVudGlsbCB0aGUgaW5pdGlhbCB6b29tIHRyYW5zaXRpb24gZW5kc1xyXG5cdFx0XHRcdHRlbXBsYXRlLmZvY3VzKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0IFxyXG5cclxuXHRcdFx0X2JpbmRFdmVudHMoKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIHNldCBjb250ZW50IGZvciBjZW50ZXIgc2xpZGUgKGZpcnN0IHRpbWUpXHJcblx0XHRzZWxmLnNldENvbnRlbnQoX2l0ZW1Ib2xkZXJzWzFdLCBfY3VycmVudEl0ZW1JbmRleCk7XHJcblx0XHRcclxuXHRcdHNlbGYudXBkYXRlQ3Vyckl0ZW0oKTtcclxuXHJcblx0XHRfc2hvdXQoJ2FmdGVySW5pdCcpO1xyXG5cclxuXHRcdGlmKCFfaXNGaXhlZFBvc2l0aW9uKSB7XHJcblxyXG5cdFx0XHQvLyBPbiBhbGwgdmVyc2lvbnMgb2YgaU9TIGxvd2VyIHRoYW4gOC4wLCB3ZSBjaGVjayBzaXplIG9mIHZpZXdwb3J0IGV2ZXJ5IHNlY29uZC5cclxuXHRcdFx0Ly8gXHJcblx0XHRcdC8vIFRoaXMgaXMgZG9uZSB0byBkZXRlY3Qgd2hlbiBTYWZhcmkgdG9wICYgYm90dG9tIGJhcnMgYXBwZWFyLCBcclxuXHRcdFx0Ly8gYXMgdGhpcyBhY3Rpb24gZG9lc24ndCB0cmlnZ2VyIGFueSBldmVudHMgKGxpa2UgcmVzaXplKS4gXHJcblx0XHRcdC8vIFxyXG5cdFx0XHQvLyBPbiBpT1M4IHRoZXkgZml4ZWQgdGhpcy5cclxuXHRcdFx0Ly8gXHJcblx0XHRcdC8vIDEwIE5vdiAyMDE0OiBpT1MgNyB1c2FnZSB+NDAlLiBpT1MgOCB1c2FnZSA1NiUuXHJcblx0XHRcdFxyXG5cdFx0XHRfdXBkYXRlU2l6ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYoIV9udW1BbmltYXRpb25zICYmICFfaXNEcmFnZ2luZyAmJiAhX2lzWm9vbWluZyAmJiAoX2N1cnJab29tTGV2ZWwgPT09IHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCkgICkge1xyXG5cdFx0XHRcdFx0c2VsZi51cGRhdGVTaXplKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LCAxMDAwKTtcclxuXHRcdH1cclxuXHJcblx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS12aXNpYmxlJyk7XHJcblx0fSxcclxuXHJcblx0Ly8gQ2xvc2UgdGhlIGdhbGxlcnksIHRoZW4gZGVzdHJveSBpdFxyXG5cdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdGlmKCFfaXNPcGVuKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRfaXNPcGVuID0gZmFsc2U7XHJcblx0XHRfaXNEZXN0cm95aW5nID0gdHJ1ZTtcclxuXHRcdF9zaG91dCgnY2xvc2UnKTtcclxuXHRcdF91bmJpbmRFdmVudHMoKTtcclxuXHJcblx0XHRfc2hvd09ySGlkZShzZWxmLmN1cnJJdGVtLCBudWxsLCB0cnVlLCBzZWxmLmRlc3Ryb3kpO1xyXG5cdH0sXHJcblxyXG5cdC8vIGRlc3Ryb3lzIHRoZSBnYWxsZXJ5ICh1bmJpbmRzIGV2ZW50cywgY2xlYW5zIHVwIGludGVydmFscyBhbmQgdGltZW91dHMgdG8gYXZvaWQgbWVtb3J5IGxlYWtzKVxyXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xyXG5cdFx0X3Nob3V0KCdkZXN0cm95Jyk7XHJcblxyXG5cdFx0aWYoX3Nob3dPckhpZGVUaW1lb3V0KSB7XHJcblx0XHRcdGNsZWFyVGltZW91dChfc2hvd09ySGlkZVRpbWVvdXQpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHR0ZW1wbGF0ZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcclxuXHRcdHRlbXBsYXRlLmNsYXNzTmFtZSA9IF9pbml0YWxDbGFzc05hbWU7XHJcblxyXG5cdFx0aWYoX3VwZGF0ZVNpemVJbnRlcnZhbCkge1xyXG5cdFx0XHRjbGVhckludGVydmFsKF91cGRhdGVTaXplSW50ZXJ2YWwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZyYW1ld29yay51bmJpbmQoc2VsZi5zY3JvbGxXcmFwLCBfZG93bkV2ZW50cywgc2VsZik7XHJcblxyXG5cdFx0Ly8gd2UgdW5iaW5kIHNjcm9sbCBldmVudCBhdCB0aGUgZW5kLCBhcyBjbG9zaW5nIGFuaW1hdGlvbiBtYXkgZGVwZW5kIG9uIGl0XHJcblx0XHRmcmFtZXdvcmsudW5iaW5kKHdpbmRvdywgJ3Njcm9sbCcsIHNlbGYpO1xyXG5cclxuXHRcdF9zdG9wRHJhZ1VwZGF0ZUxvb3AoKTtcclxuXHJcblx0XHRfc3RvcEFsbEFuaW1hdGlvbnMoKTtcclxuXHJcblx0XHRfbGlzdGVuZXJzID0gbnVsbDtcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBQYW4gaW1hZ2UgdG8gcG9zaXRpb25cclxuXHQgKiBAcGFyYW0ge051bWJlcn0geCAgICAgXHJcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgIFxyXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gZm9yY2UgV2lsbCBpZ25vcmUgYm91bmRzIGlmIHNldCB0byB0cnVlLlxyXG5cdCAqL1xyXG5cdHBhblRvOiBmdW5jdGlvbih4LHksZm9yY2UpIHtcclxuXHRcdGlmKCFmb3JjZSkge1xyXG5cdFx0XHRpZih4ID4gX2N1cnJQYW5Cb3VuZHMubWluLngpIHtcclxuXHRcdFx0XHR4ID0gX2N1cnJQYW5Cb3VuZHMubWluLng7XHJcblx0XHRcdH0gZWxzZSBpZih4IDwgX2N1cnJQYW5Cb3VuZHMubWF4LngpIHtcclxuXHRcdFx0XHR4ID0gX2N1cnJQYW5Cb3VuZHMubWF4Lng7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKHkgPiBfY3VyclBhbkJvdW5kcy5taW4ueSkge1xyXG5cdFx0XHRcdHkgPSBfY3VyclBhbkJvdW5kcy5taW4ueTtcclxuXHRcdFx0fSBlbHNlIGlmKHkgPCBfY3VyclBhbkJvdW5kcy5tYXgueSkge1xyXG5cdFx0XHRcdHkgPSBfY3VyclBhbkJvdW5kcy5tYXgueTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRfcGFuT2Zmc2V0LnggPSB4O1xyXG5cdFx0X3Bhbk9mZnNldC55ID0geTtcclxuXHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XHJcblx0fSxcclxuXHRcclxuXHRoYW5kbGVFdmVudDogZnVuY3Rpb24gKGUpIHtcclxuXHRcdGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcclxuXHRcdGlmKF9nbG9iYWxFdmVudEhhbmRsZXJzW2UudHlwZV0pIHtcclxuXHRcdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnNbZS50eXBlXShlKTtcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHJcblx0Z29UbzogZnVuY3Rpb24oaW5kZXgpIHtcclxuXHJcblx0XHRpbmRleCA9IF9nZXRMb29wZWRJZChpbmRleCk7XHJcblxyXG5cdFx0dmFyIGRpZmYgPSBpbmRleCAtIF9jdXJyZW50SXRlbUluZGV4O1xyXG5cdFx0X2luZGV4RGlmZiA9IGRpZmY7XHJcblxyXG5cdFx0X2N1cnJlbnRJdGVtSW5kZXggPSBpbmRleDtcclxuXHRcdHNlbGYuY3Vyckl0ZW0gPSBfZ2V0SXRlbUF0KCBfY3VycmVudEl0ZW1JbmRleCApO1xyXG5cdFx0X2N1cnJQb3NpdGlvbkluZGV4IC09IGRpZmY7XHJcblx0XHRcclxuXHRcdF9tb3ZlTWFpblNjcm9sbChfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXgpO1xyXG5cdFx0XHJcblxyXG5cdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XHJcblx0XHRfbWFpblNjcm9sbEFuaW1hdGluZyA9IGZhbHNlO1xyXG5cclxuXHRcdHNlbGYudXBkYXRlQ3Vyckl0ZW0oKTtcclxuXHR9LFxyXG5cdG5leHQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0c2VsZi5nb1RvKCBfY3VycmVudEl0ZW1JbmRleCArIDEpO1xyXG5cdH0sXHJcblx0cHJldjogZnVuY3Rpb24oKSB7XHJcblx0XHRzZWxmLmdvVG8oIF9jdXJyZW50SXRlbUluZGV4IC0gMSk7XHJcblx0fSxcclxuXHJcblx0Ly8gdXBkYXRlIGN1cnJlbnQgem9vbS9wYW4gb2JqZWN0c1xyXG5cdHVwZGF0ZUN1cnJab29tSXRlbTogZnVuY3Rpb24oZW11bGF0ZVNldENvbnRlbnQpIHtcclxuXHRcdGlmKGVtdWxhdGVTZXRDb250ZW50KSB7XHJcblx0XHRcdF9zaG91dCgnYmVmb3JlQ2hhbmdlJywgMCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gaXRlbUhvbGRlclsxXSBpcyBtaWRkbGUgKGN1cnJlbnQpIGl0ZW1cclxuXHRcdGlmKF9pdGVtSG9sZGVyc1sxXS5lbC5jaGlsZHJlbi5sZW5ndGgpIHtcclxuXHRcdFx0dmFyIHpvb21FbGVtZW50ID0gX2l0ZW1Ib2xkZXJzWzFdLmVsLmNoaWxkcmVuWzBdO1xyXG5cdFx0XHRpZiggZnJhbWV3b3JrLmhhc0NsYXNzKHpvb21FbGVtZW50LCAncHN3cF9fem9vbS13cmFwJykgKSB7XHJcblx0XHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gem9vbUVsZW1lbnQuc3R5bGU7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gbnVsbDtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gbnVsbDtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcdFxyXG5cdFx0X3N0YXJ0Wm9vbUxldmVsID0gX2N1cnJab29tTGV2ZWwgPSBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWw7XHJcblxyXG5cdFx0X3Bhbk9mZnNldC54ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLng7XHJcblx0XHRfcGFuT2Zmc2V0LnkgPSBfY3VyclBhbkJvdW5kcy5jZW50ZXIueTtcclxuXHJcblx0XHRpZihlbXVsYXRlU2V0Q29udGVudCkge1xyXG5cdFx0XHRfc2hvdXQoJ2FmdGVyQ2hhbmdlJyk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblxyXG5cdGludmFsaWRhdGVDdXJySXRlbXM6IGZ1bmN0aW9uKCkge1xyXG5cdFx0X2l0ZW1zTmVlZFVwZGF0ZSA9IHRydWU7XHJcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgTlVNX0hPTERFUlM7IGkrKykge1xyXG5cdFx0XHRpZiggX2l0ZW1Ib2xkZXJzW2ldLml0ZW0gKSB7XHJcblx0XHRcdFx0X2l0ZW1Ib2xkZXJzW2ldLml0ZW0ubmVlZHNVcGRhdGUgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0dXBkYXRlQ3Vyckl0ZW06IGZ1bmN0aW9uKGJlZm9yZUFuaW1hdGlvbikge1xyXG5cclxuXHRcdGlmKF9pbmRleERpZmYgPT09IDApIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBkaWZmQWJzID0gTWF0aC5hYnMoX2luZGV4RGlmZiksXHJcblx0XHRcdHRlbXBIb2xkZXI7XHJcblxyXG5cdFx0aWYoYmVmb3JlQW5pbWF0aW9uICYmIGRpZmZBYnMgPCAyKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0c2VsZi5jdXJySXRlbSA9IF9nZXRJdGVtQXQoIF9jdXJyZW50SXRlbUluZGV4ICk7XHJcblx0XHRfcmVuZGVyTWF4UmVzb2x1dGlvbiA9IGZhbHNlO1xyXG5cdFx0XHJcblx0XHRfc2hvdXQoJ2JlZm9yZUNoYW5nZScsIF9pbmRleERpZmYpO1xyXG5cclxuXHRcdGlmKGRpZmZBYnMgPj0gTlVNX0hPTERFUlMpIHtcclxuXHRcdFx0X2NvbnRhaW5lclNoaWZ0SW5kZXggKz0gX2luZGV4RGlmZiArIChfaW5kZXhEaWZmID4gMCA/IC1OVU1fSE9MREVSUyA6IE5VTV9IT0xERVJTKTtcclxuXHRcdFx0ZGlmZkFicyA9IE5VTV9IT0xERVJTO1xyXG5cdFx0fVxyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IGRpZmZBYnM7IGkrKykge1xyXG5cdFx0XHRpZihfaW5kZXhEaWZmID4gMCkge1xyXG5cdFx0XHRcdHRlbXBIb2xkZXIgPSBfaXRlbUhvbGRlcnMuc2hpZnQoKTtcclxuXHRcdFx0XHRfaXRlbUhvbGRlcnNbTlVNX0hPTERFUlMtMV0gPSB0ZW1wSG9sZGVyOyAvLyBtb3ZlIGZpcnN0IHRvIGxhc3RcclxuXHJcblx0XHRcdFx0X2NvbnRhaW5lclNoaWZ0SW5kZXgrKztcclxuXHRcdFx0XHRfc2V0VHJhbnNsYXRlWCggKF9jb250YWluZXJTaGlmdEluZGV4KzIpICogX3NsaWRlU2l6ZS54LCB0ZW1wSG9sZGVyLmVsLnN0eWxlKTtcclxuXHRcdFx0XHRzZWxmLnNldENvbnRlbnQodGVtcEhvbGRlciwgX2N1cnJlbnRJdGVtSW5kZXggLSBkaWZmQWJzICsgaSArIDEgKyAxKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0ZW1wSG9sZGVyID0gX2l0ZW1Ib2xkZXJzLnBvcCgpO1xyXG5cdFx0XHRcdF9pdGVtSG9sZGVycy51bnNoaWZ0KCB0ZW1wSG9sZGVyICk7IC8vIG1vdmUgbGFzdCB0byBmaXJzdFxyXG5cclxuXHRcdFx0XHRfY29udGFpbmVyU2hpZnRJbmRleC0tO1xyXG5cdFx0XHRcdF9zZXRUcmFuc2xhdGVYKCBfY29udGFpbmVyU2hpZnRJbmRleCAqIF9zbGlkZVNpemUueCwgdGVtcEhvbGRlci5lbC5zdHlsZSk7XHJcblx0XHRcdFx0c2VsZi5zZXRDb250ZW50KHRlbXBIb2xkZXIsIF9jdXJyZW50SXRlbUluZGV4ICsgZGlmZkFicyAtIGkgLSAxIC0gMSk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gcmVzZXQgem9vbS9wYW4gb24gcHJldmlvdXMgaXRlbVxyXG5cdFx0aWYoX2N1cnJab29tRWxlbWVudFN0eWxlICYmIE1hdGguYWJzKF9pbmRleERpZmYpID09PSAxKSB7XHJcblxyXG5cdFx0XHR2YXIgcHJldkl0ZW0gPSBfZ2V0SXRlbUF0KF9wcmV2SXRlbUluZGV4KTtcclxuXHRcdFx0aWYocHJldkl0ZW0uaW5pdGlhbFpvb21MZXZlbCAhPT0gX2N1cnJab29tTGV2ZWwpIHtcclxuXHRcdFx0XHRfY2FsY3VsYXRlSXRlbVNpemUocHJldkl0ZW0gLCBfdmlld3BvcnRTaXplICk7XHJcblx0XHRcdFx0X3NldEltYWdlU2l6ZShwcmV2SXRlbSk7XHJcblx0XHRcdFx0X2FwcGx5Wm9vbVBhblRvSXRlbSggcHJldkl0ZW0gKTsgXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHQvLyByZXNldCBkaWZmIGFmdGVyIHVwZGF0ZVxyXG5cdFx0X2luZGV4RGlmZiA9IDA7XHJcblxyXG5cdFx0c2VsZi51cGRhdGVDdXJyWm9vbUl0ZW0oKTtcclxuXHJcblx0XHRfcHJldkl0ZW1JbmRleCA9IF9jdXJyZW50SXRlbUluZGV4O1xyXG5cclxuXHRcdF9zaG91dCgnYWZ0ZXJDaGFuZ2UnKTtcclxuXHRcdFxyXG5cdH0sXHJcblxyXG5cclxuXHJcblx0dXBkYXRlU2l6ZTogZnVuY3Rpb24oZm9yY2UpIHtcclxuXHRcdFxyXG5cdFx0aWYoIV9pc0ZpeGVkUG9zaXRpb24gJiYgX29wdGlvbnMubW9kYWwpIHtcclxuXHRcdFx0dmFyIHdpbmRvd1Njcm9sbFkgPSBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpO1xyXG5cdFx0XHRpZihfY3VycmVudFdpbmRvd1Njcm9sbFkgIT09IHdpbmRvd1Njcm9sbFkpIHtcclxuXHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS50b3AgPSB3aW5kb3dTY3JvbGxZICsgJ3B4JztcclxuXHRcdFx0XHRfY3VycmVudFdpbmRvd1Njcm9sbFkgPSB3aW5kb3dTY3JvbGxZO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmKCFmb3JjZSAmJiBfd2luZG93VmlzaWJsZVNpemUueCA9PT0gd2luZG93LmlubmVyV2lkdGggJiYgX3dpbmRvd1Zpc2libGVTaXplLnkgPT09IHdpbmRvdy5pbm5lckhlaWdodCkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRfd2luZG93VmlzaWJsZVNpemUueCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG5cdFx0XHRfd2luZG93VmlzaWJsZVNpemUueSA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHJcblx0XHRcdC8vdGVtcGxhdGUuc3R5bGUud2lkdGggPSBfd2luZG93VmlzaWJsZVNpemUueCArICdweCc7XHJcblx0XHRcdHRlbXBsYXRlLnN0eWxlLmhlaWdodCA9IF93aW5kb3dWaXNpYmxlU2l6ZS55ICsgJ3B4JztcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdF92aWV3cG9ydFNpemUueCA9IHNlbGYuc2Nyb2xsV3JhcC5jbGllbnRXaWR0aDtcclxuXHRcdF92aWV3cG9ydFNpemUueSA9IHNlbGYuc2Nyb2xsV3JhcC5jbGllbnRIZWlnaHQ7XHJcblxyXG5cdFx0X3VwZGF0ZVBhZ2VTY3JvbGxPZmZzZXQoKTtcclxuXHJcblx0XHRfc2xpZGVTaXplLnggPSBfdmlld3BvcnRTaXplLnggKyBNYXRoLnJvdW5kKF92aWV3cG9ydFNpemUueCAqIF9vcHRpb25zLnNwYWNpbmcpO1xyXG5cdFx0X3NsaWRlU2l6ZS55ID0gX3ZpZXdwb3J0U2l6ZS55O1xyXG5cclxuXHRcdF9tb3ZlTWFpblNjcm9sbChfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXgpO1xyXG5cclxuXHRcdF9zaG91dCgnYmVmb3JlUmVzaXplJyk7IC8vIGV2ZW4gbWF5IGJlIHVzZWQgZm9yIGV4YW1wbGUgdG8gc3dpdGNoIGltYWdlIHNvdXJjZXNcclxuXHJcblxyXG5cdFx0Ly8gZG9uJ3QgcmUtY2FsY3VsYXRlIHNpemUgb24gaW5pdGFsIHNpemUgdXBkYXRlXHJcblx0XHRpZihfY29udGFpbmVyU2hpZnRJbmRleCAhPT0gdW5kZWZpbmVkKSB7XHJcblxyXG5cdFx0XHR2YXIgaG9sZGVyLFxyXG5cdFx0XHRcdGl0ZW0sXHJcblx0XHRcdFx0aEluZGV4O1xyXG5cclxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IE5VTV9IT0xERVJTOyBpKyspIHtcclxuXHRcdFx0XHRob2xkZXIgPSBfaXRlbUhvbGRlcnNbaV07XHJcblx0XHRcdFx0X3NldFRyYW5zbGF0ZVgoIChpK19jb250YWluZXJTaGlmdEluZGV4KSAqIF9zbGlkZVNpemUueCwgaG9sZGVyLmVsLnN0eWxlKTtcclxuXHJcblx0XHRcdFx0aEluZGV4ID0gX2N1cnJlbnRJdGVtSW5kZXgraS0xO1xyXG5cclxuXHRcdFx0XHRpZihfb3B0aW9ucy5sb29wICYmIF9nZXROdW1JdGVtcygpID4gMikge1xyXG5cdFx0XHRcdFx0aEluZGV4ID0gX2dldExvb3BlZElkKGhJbmRleCk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyB1cGRhdGUgem9vbSBsZXZlbCBvbiBpdGVtcyBhbmQgcmVmcmVzaCBzb3VyY2UgKGlmIG5lZWRzVXBkYXRlKVxyXG5cdFx0XHRcdGl0ZW0gPSBfZ2V0SXRlbUF0KCBoSW5kZXggKTtcclxuXHJcblx0XHRcdFx0Ly8gcmUtcmVuZGVyIGdhbGxlcnkgaXRlbSBpZiBgbmVlZHNVcGRhdGVgLFxyXG5cdFx0XHRcdC8vIG9yIGRvZXNuJ3QgaGF2ZSBgYm91bmRzYCAoZW50aXJlbHkgbmV3IHNsaWRlIG9iamVjdClcclxuXHRcdFx0XHRpZiggaXRlbSAmJiAoX2l0ZW1zTmVlZFVwZGF0ZSB8fCBpdGVtLm5lZWRzVXBkYXRlIHx8ICFpdGVtLmJvdW5kcykgKSB7XHJcblxyXG5cdFx0XHRcdFx0c2VsZi5jbGVhblNsaWRlKCBpdGVtICk7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdHNlbGYuc2V0Q29udGVudCggaG9sZGVyLCBoSW5kZXggKTtcclxuXHJcblx0XHRcdFx0XHQvLyBpZiBcImNlbnRlclwiIHNsaWRlXHJcblx0XHRcdFx0XHRpZihpID09PSAxKSB7XHJcblx0XHRcdFx0XHRcdHNlbGYuY3Vyckl0ZW0gPSBpdGVtO1xyXG5cdFx0XHRcdFx0XHRzZWxmLnVwZGF0ZUN1cnJab29tSXRlbSh0cnVlKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRpdGVtLm5lZWRzVXBkYXRlID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdH0gZWxzZSBpZihob2xkZXIuaW5kZXggPT09IC0xICYmIGhJbmRleCA+PSAwKSB7XHJcblx0XHRcdFx0XHQvLyBhZGQgY29udGVudCBmaXJzdCB0aW1lXHJcblx0XHRcdFx0XHRzZWxmLnNldENvbnRlbnQoIGhvbGRlciwgaEluZGV4ICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKGl0ZW0gJiYgaXRlbS5jb250YWluZXIpIHtcclxuXHRcdFx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShpdGVtLCBfdmlld3BvcnRTaXplKTtcclxuXHRcdFx0XHRcdF9zZXRJbWFnZVNpemUoaXRlbSk7XHJcblx0XHRcdFx0XHRfYXBwbHlab29tUGFuVG9JdGVtKCBpdGVtICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcdF9pdGVtc05lZWRVcGRhdGUgPSBmYWxzZTtcclxuXHRcdH1cdFxyXG5cclxuXHRcdF9zdGFydFpvb21MZXZlbCA9IF9jdXJyWm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsO1xyXG5cdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcclxuXHJcblx0XHRpZihfY3VyclBhbkJvdW5kcykge1xyXG5cdFx0XHRfcGFuT2Zmc2V0LnggPSBfY3VyclBhbkJvdW5kcy5jZW50ZXIueDtcclxuXHRcdFx0X3Bhbk9mZnNldC55ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLnk7XHJcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCB0cnVlICk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdF9zaG91dCgncmVzaXplJyk7XHJcblx0fSxcclxuXHRcclxuXHQvLyBab29tIGN1cnJlbnQgaXRlbSB0b1xyXG5cdHpvb21UbzogZnVuY3Rpb24oZGVzdFpvb21MZXZlbCwgY2VudGVyUG9pbnQsIHNwZWVkLCBlYXNpbmdGbiwgdXBkYXRlRm4pIHtcclxuXHRcdC8qXHJcblx0XHRcdGlmKGRlc3Rab29tTGV2ZWwgPT09ICdmaXQnKSB7XHJcblx0XHRcdFx0ZGVzdFpvb21MZXZlbCA9IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW87XHJcblx0XHRcdH0gZWxzZSBpZihkZXN0Wm9vbUxldmVsID09PSAnZmlsbCcpIHtcclxuXHRcdFx0XHRkZXN0Wm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5maWxsUmF0aW87XHJcblx0XHRcdH1cclxuXHRcdCovXHJcblxyXG5cdFx0aWYoY2VudGVyUG9pbnQpIHtcclxuXHRcdFx0X3N0YXJ0Wm9vbUxldmVsID0gX2N1cnJab29tTGV2ZWw7XHJcblx0XHRcdF9taWRab29tUG9pbnQueCA9IE1hdGguYWJzKGNlbnRlclBvaW50LngpIC0gX3Bhbk9mZnNldC54IDtcclxuXHRcdFx0X21pZFpvb21Qb2ludC55ID0gTWF0aC5hYnMoY2VudGVyUG9pbnQueSkgLSBfcGFuT2Zmc2V0LnkgO1xyXG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX3N0YXJ0UGFuT2Zmc2V0LCBfcGFuT2Zmc2V0KTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZGVzdFBhbkJvdW5kcyA9IF9jYWxjdWxhdGVQYW5Cb3VuZHMoZGVzdFpvb21MZXZlbCwgZmFsc2UpLFxyXG5cdFx0XHRkZXN0UGFuT2Zmc2V0ID0ge307XHJcblxyXG5cdFx0X21vZGlmeURlc3RQYW5PZmZzZXQoJ3gnLCBkZXN0UGFuQm91bmRzLCBkZXN0UGFuT2Zmc2V0LCBkZXN0Wm9vbUxldmVsKTtcclxuXHRcdF9tb2RpZnlEZXN0UGFuT2Zmc2V0KCd5JywgZGVzdFBhbkJvdW5kcywgZGVzdFBhbk9mZnNldCwgZGVzdFpvb21MZXZlbCk7XHJcblxyXG5cdFx0dmFyIGluaXRpYWxab29tTGV2ZWwgPSBfY3Vyclpvb21MZXZlbDtcclxuXHRcdHZhciBpbml0aWFsUGFuT2Zmc2V0ID0ge1xyXG5cdFx0XHR4OiBfcGFuT2Zmc2V0LngsXHJcblx0XHRcdHk6IF9wYW5PZmZzZXQueVxyXG5cdFx0fTtcclxuXHJcblx0XHRfcm91bmRQb2ludChkZXN0UGFuT2Zmc2V0KTtcclxuXHJcblx0XHR2YXIgb25VcGRhdGUgPSBmdW5jdGlvbihub3cpIHtcclxuXHRcdFx0aWYobm93ID09PSAxKSB7XHJcblx0XHRcdFx0X2N1cnJab29tTGV2ZWwgPSBkZXN0Wm9vbUxldmVsO1xyXG5cdFx0XHRcdF9wYW5PZmZzZXQueCA9IGRlc3RQYW5PZmZzZXQueDtcclxuXHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSBkZXN0UGFuT2Zmc2V0Lnk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0X2N1cnJab29tTGV2ZWwgPSAoZGVzdFpvb21MZXZlbCAtIGluaXRpYWxab29tTGV2ZWwpICogbm93ICsgaW5pdGlhbFpvb21MZXZlbDtcclxuXHRcdFx0XHRfcGFuT2Zmc2V0LnggPSAoZGVzdFBhbk9mZnNldC54IC0gaW5pdGlhbFBhbk9mZnNldC54KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueDtcclxuXHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSAoZGVzdFBhbk9mZnNldC55IC0gaW5pdGlhbFBhbk9mZnNldC55KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYodXBkYXRlRm4pIHtcclxuXHRcdFx0XHR1cGRhdGVGbihub3cpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbiggbm93ID09PSAxICk7XHJcblx0XHR9O1xyXG5cclxuXHRcdGlmKHNwZWVkKSB7XHJcblx0XHRcdF9hbmltYXRlUHJvcCgnY3VzdG9tWm9vbVRvJywgMCwgMSwgc3BlZWQsIGVhc2luZ0ZuIHx8IGZyYW1ld29yay5lYXNpbmcuc2luZS5pbk91dCwgb25VcGRhdGUpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0b25VcGRhdGUoMSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcbn07XHJcblxyXG5cclxuLyo+PmNvcmUqL1xyXG5cclxuLyo+Pmdlc3R1cmVzKi9cclxuLyoqXHJcbiAqIE1vdXNlL3RvdWNoL3BvaW50ZXIgZXZlbnQgaGFuZGxlcnMuXHJcbiAqIFxyXG4gKiBzZXBhcmF0ZWQgZnJvbSBAY29yZS5qcyBmb3IgcmVhZGFiaWxpdHlcclxuICovXHJcblxyXG52YXIgTUlOX1NXSVBFX0RJU1RBTkNFID0gMzAsXHJcblx0RElSRUNUSU9OX0NIRUNLX09GRlNFVCA9IDEwOyAvLyBhbW91bnQgb2YgcGl4ZWxzIHRvIGRyYWcgdG8gZGV0ZXJtaW5lIGRpcmVjdGlvbiBvZiBzd2lwZVxyXG5cclxudmFyIF9nZXN0dXJlU3RhcnRUaW1lLFxyXG5cdF9nZXN0dXJlQ2hlY2tTcGVlZFRpbWUsXHJcblxyXG5cdC8vIHBvb2wgb2Ygb2JqZWN0cyB0aGF0IGFyZSB1c2VkIGR1cmluZyBkcmFnZ2luZyBvZiB6b29taW5nXHJcblx0cCA9IHt9LCAvLyBmaXJzdCBwb2ludFxyXG5cdHAyID0ge30sIC8vIHNlY29uZCBwb2ludCAoZm9yIHpvb20gZ2VzdHVyZSlcclxuXHRkZWx0YSA9IHt9LFxyXG5cdF9jdXJyUG9pbnQgPSB7fSxcclxuXHRfc3RhcnRQb2ludCA9IHt9LFxyXG5cdF9jdXJyUG9pbnRlcnMgPSBbXSxcclxuXHRfc3RhcnRNYWluU2Nyb2xsUG9zID0ge30sXHJcblx0X3JlbGVhc2VBbmltRGF0YSxcclxuXHRfcG9zUG9pbnRzID0gW10sIC8vIGFycmF5IG9mIHBvaW50cyBkdXJpbmcgZHJhZ2dpbmcsIHVzZWQgdG8gZGV0ZXJtaW5lIHR5cGUgb2YgZ2VzdHVyZVxyXG5cdF90ZW1wUG9pbnQgPSB7fSxcclxuXHJcblx0X2lzWm9vbWluZ0luLFxyXG5cdF92ZXJ0aWNhbERyYWdJbml0aWF0ZWQsXHJcblx0X29sZEFuZHJvaWRUb3VjaEVuZFRpbWVvdXQsXHJcblx0X2N1cnJab29tZWRJdGVtSW5kZXggPSAwLFxyXG5cdF9jZW50ZXJQb2ludCA9IF9nZXRFbXB0eVBvaW50KCksXHJcblx0X2xhc3RSZWxlYXNlVGltZSA9IDAsXHJcblx0X2lzRHJhZ2dpbmcsIC8vIGF0IGxlYXN0IG9uZSBwb2ludGVyIGlzIGRvd25cclxuXHRfaXNNdWx0aXRvdWNoLCAvLyBhdCBsZWFzdCB0d28gX3BvaW50ZXJzIGFyZSBkb3duXHJcblx0X3pvb21TdGFydGVkLCAvLyB6b29tIGxldmVsIGNoYW5nZWQgZHVyaW5nIHpvb20gZ2VzdHVyZVxyXG5cdF9tb3ZlZCxcclxuXHRfZHJhZ0FuaW1GcmFtZSxcclxuXHRfbWFpblNjcm9sbFNoaWZ0ZWQsXHJcblx0X2N1cnJlbnRQb2ludHMsIC8vIGFycmF5IG9mIGN1cnJlbnQgdG91Y2ggcG9pbnRzXHJcblx0X2lzWm9vbWluZyxcclxuXHRfY3VyclBvaW50c0Rpc3RhbmNlLFxyXG5cdF9zdGFydFBvaW50c0Rpc3RhbmNlLFxyXG5cdF9jdXJyUGFuQm91bmRzLFxyXG5cdF9tYWluU2Nyb2xsUG9zID0gX2dldEVtcHR5UG9pbnQoKSxcclxuXHRfY3Vyclpvb21FbGVtZW50U3R5bGUsXHJcblx0X21haW5TY3JvbGxBbmltYXRpbmcsIC8vIHRydWUsIGlmIGFuaW1hdGlvbiBhZnRlciBzd2lwZSBnZXN0dXJlIGlzIHJ1bm5pbmdcclxuXHRfbWlkWm9vbVBvaW50ID0gX2dldEVtcHR5UG9pbnQoKSxcclxuXHRfY3VyckNlbnRlclBvaW50ID0gX2dldEVtcHR5UG9pbnQoKSxcclxuXHRfZGlyZWN0aW9uLFxyXG5cdF9pc0ZpcnN0TW92ZSxcclxuXHRfb3BhY2l0eUNoYW5nZWQsXHJcblx0X2JnT3BhY2l0eSxcclxuXHRfd2FzT3ZlckluaXRpYWxab29tLFxyXG5cclxuXHRfaXNFcXVhbFBvaW50cyA9IGZ1bmN0aW9uKHAxLCBwMikge1xyXG5cdFx0cmV0dXJuIHAxLnggPT09IHAyLnggJiYgcDEueSA9PT0gcDIueTtcclxuXHR9LFxyXG5cdF9pc05lYXJieVBvaW50cyA9IGZ1bmN0aW9uKHRvdWNoMCwgdG91Y2gxKSB7XHJcblx0XHRyZXR1cm4gTWF0aC5hYnModG91Y2gwLnggLSB0b3VjaDEueCkgPCBET1VCTEVfVEFQX1JBRElVUyAmJiBNYXRoLmFicyh0b3VjaDAueSAtIHRvdWNoMS55KSA8IERPVUJMRV9UQVBfUkFESVVTO1xyXG5cdH0sXHJcblx0X2NhbGN1bGF0ZVBvaW50c0Rpc3RhbmNlID0gZnVuY3Rpb24ocDEsIHAyKSB7XHJcblx0XHRfdGVtcFBvaW50LnggPSBNYXRoLmFicyggcDEueCAtIHAyLnggKTtcclxuXHRcdF90ZW1wUG9pbnQueSA9IE1hdGguYWJzKCBwMS55IC0gcDIueSApO1xyXG5cdFx0cmV0dXJuIE1hdGguc3FydChfdGVtcFBvaW50LnggKiBfdGVtcFBvaW50LnggKyBfdGVtcFBvaW50LnkgKiBfdGVtcFBvaW50LnkpO1xyXG5cdH0sXHJcblx0X3N0b3BEcmFnVXBkYXRlTG9vcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoX2RyYWdBbmltRnJhbWUpIHtcclxuXHRcdFx0X2NhbmNlbEFGKF9kcmFnQW5pbUZyYW1lKTtcclxuXHRcdFx0X2RyYWdBbmltRnJhbWUgPSBudWxsO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0X2RyYWdVcGRhdGVMb29wID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihfaXNEcmFnZ2luZykge1xyXG5cdFx0XHRfZHJhZ0FuaW1GcmFtZSA9IF9yZXF1ZXN0QUYoX2RyYWdVcGRhdGVMb29wKTtcclxuXHRcdFx0X3JlbmRlck1vdmVtZW50KCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHRfY2FuUGFuID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gIShfb3B0aW9ucy5zY2FsZU1vZGUgPT09ICdmaXQnICYmIF9jdXJyWm9vbUxldmVsID09PSAgc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsKTtcclxuXHR9LFxyXG5cdFxyXG5cdC8vIGZpbmQgdGhlIGNsb3Nlc3QgcGFyZW50IERPTSBlbGVtZW50XHJcblx0X2Nsb3Nlc3RFbGVtZW50ID0gZnVuY3Rpb24oZWwsIGZuKSB7XHJcblx0ICBcdGlmKCFlbCB8fCBlbCA9PT0gZG9jdW1lbnQpIHtcclxuXHQgIFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0ICBcdH1cclxuXHJcblx0ICBcdC8vIGRvbid0IHNlYXJjaCBlbGVtZW50cyBhYm92ZSBwc3dwX19zY3JvbGwtd3JhcFxyXG5cdCAgXHRpZihlbC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdjbGFzcycpLmluZGV4T2YoJ3Bzd3BfX3Njcm9sbC13cmFwJykgPiAtMSApIHtcclxuXHQgIFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0ICBcdH1cclxuXHJcblx0ICBcdGlmKCBmbihlbCkgKSB7XHJcblx0ICBcdFx0cmV0dXJuIGVsO1xyXG5cdCAgXHR9XHJcblxyXG5cdCAgXHRyZXR1cm4gX2Nsb3Nlc3RFbGVtZW50KGVsLnBhcmVudE5vZGUsIGZuKTtcclxuXHR9LFxyXG5cclxuXHRfcHJldmVudE9iaiA9IHt9LFxyXG5cdF9wcmV2ZW50RGVmYXVsdEV2ZW50QmVoYXZpb3VyID0gZnVuY3Rpb24oZSwgaXNEb3duKSB7XHJcblx0ICAgIF9wcmV2ZW50T2JqLnByZXZlbnQgPSAhX2Nsb3Nlc3RFbGVtZW50KGUudGFyZ2V0LCBfb3B0aW9ucy5pc0NsaWNrYWJsZUVsZW1lbnQpO1xyXG5cclxuXHRcdF9zaG91dCgncHJldmVudERyYWdFdmVudCcsIGUsIGlzRG93biwgX3ByZXZlbnRPYmopO1xyXG5cdFx0cmV0dXJuIF9wcmV2ZW50T2JqLnByZXZlbnQ7XHJcblxyXG5cdH0sXHJcblx0X2NvbnZlcnRUb3VjaFRvUG9pbnQgPSBmdW5jdGlvbih0b3VjaCwgcCkge1xyXG5cdFx0cC54ID0gdG91Y2gucGFnZVg7XHJcblx0XHRwLnkgPSB0b3VjaC5wYWdlWTtcclxuXHRcdHAuaWQgPSB0b3VjaC5pZGVudGlmaWVyO1xyXG5cdFx0cmV0dXJuIHA7XHJcblx0fSxcclxuXHRfZmluZENlbnRlck9mUG9pbnRzID0gZnVuY3Rpb24ocDEsIHAyLCBwQ2VudGVyKSB7XHJcblx0XHRwQ2VudGVyLnggPSAocDEueCArIHAyLngpICogMC41O1xyXG5cdFx0cENlbnRlci55ID0gKHAxLnkgKyBwMi55KSAqIDAuNTtcclxuXHR9LFxyXG5cdF9wdXNoUG9zUG9pbnQgPSBmdW5jdGlvbih0aW1lLCB4LCB5KSB7XHJcblx0XHRpZih0aW1lIC0gX2dlc3R1cmVDaGVja1NwZWVkVGltZSA+IDUwKSB7XHJcblx0XHRcdHZhciBvID0gX3Bvc1BvaW50cy5sZW5ndGggPiAyID8gX3Bvc1BvaW50cy5zaGlmdCgpIDoge307XHJcblx0XHRcdG8ueCA9IHg7XHJcblx0XHRcdG8ueSA9IHk7IFxyXG5cdFx0XHRfcG9zUG9pbnRzLnB1c2gobyk7XHJcblx0XHRcdF9nZXN0dXJlQ2hlY2tTcGVlZFRpbWUgPSB0aW1lO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdF9jYWxjdWxhdGVWZXJ0aWNhbERyYWdPcGFjaXR5UmF0aW8gPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciB5T2Zmc2V0ID0gX3Bhbk9mZnNldC55IC0gc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb24ueTsgLy8gZGlmZmVyZW5jZSBiZXR3ZWVuIGluaXRpYWwgYW5kIGN1cnJlbnQgcG9zaXRpb25cclxuXHRcdHJldHVybiAxIC0gIE1hdGguYWJzKCB5T2Zmc2V0IC8gKF92aWV3cG9ydFNpemUueSAvIDIpICApO1xyXG5cdH0sXHJcblxyXG5cdFxyXG5cdC8vIHBvaW50cyBwb29sLCByZXVzZWQgZHVyaW5nIHRvdWNoIGV2ZW50c1xyXG5cdF9lUG9pbnQxID0ge30sXHJcblx0X2VQb2ludDIgPSB7fSxcclxuXHRfdGVtcFBvaW50c0FyciA9IFtdLFxyXG5cdF90ZW1wQ291bnRlcixcclxuXHRfZ2V0VG91Y2hQb2ludHMgPSBmdW5jdGlvbihlKSB7XHJcblx0XHQvLyBjbGVhbiB1cCBwcmV2aW91cyBwb2ludHMsIHdpdGhvdXQgcmVjcmVhdGluZyBhcnJheVxyXG5cdFx0d2hpbGUoX3RlbXBQb2ludHNBcnIubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRfdGVtcFBvaW50c0Fyci5wb3AoKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZighX3BvaW50ZXJFdmVudEVuYWJsZWQpIHtcclxuXHRcdFx0aWYoZS50eXBlLmluZGV4T2YoJ3RvdWNoJykgPiAtMSkge1xyXG5cclxuXHRcdFx0XHRpZihlLnRvdWNoZXMgJiYgZS50b3VjaGVzLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRcdF90ZW1wUG9pbnRzQXJyWzBdID0gX2NvbnZlcnRUb3VjaFRvUG9pbnQoZS50b3VjaGVzWzBdLCBfZVBvaW50MSk7XHJcblx0XHRcdFx0XHRpZihlLnRvdWNoZXMubGVuZ3RoID4gMSkge1xyXG5cdFx0XHRcdFx0XHRfdGVtcFBvaW50c0FyclsxXSA9IF9jb252ZXJ0VG91Y2hUb1BvaW50KGUudG91Y2hlc1sxXSwgX2VQb2ludDIpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRfZVBvaW50MS54ID0gZS5wYWdlWDtcclxuXHRcdFx0XHRfZVBvaW50MS55ID0gZS5wYWdlWTtcclxuXHRcdFx0XHRfZVBvaW50MS5pZCA9ICcnO1xyXG5cdFx0XHRcdF90ZW1wUG9pbnRzQXJyWzBdID0gX2VQb2ludDE7Ly9fZVBvaW50MTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0X3RlbXBDb3VudGVyID0gMDtcclxuXHRcdFx0Ly8gd2UgY2FuIHVzZSBmb3JFYWNoLCBhcyBwb2ludGVyIGV2ZW50cyBhcmUgc3VwcG9ydGVkIG9ubHkgaW4gbW9kZXJuIGJyb3dzZXJzXHJcblx0XHRcdF9jdXJyUG9pbnRlcnMuZm9yRWFjaChmdW5jdGlvbihwKSB7XHJcblx0XHRcdFx0aWYoX3RlbXBDb3VudGVyID09PSAwKSB7XHJcblx0XHRcdFx0XHRfdGVtcFBvaW50c0FyclswXSA9IHA7XHJcblx0XHRcdFx0fSBlbHNlIGlmKF90ZW1wQ291bnRlciA9PT0gMSkge1xyXG5cdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMV0gPSBwO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRfdGVtcENvdW50ZXIrKztcclxuXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIF90ZW1wUG9pbnRzQXJyO1xyXG5cdH0sXHJcblxyXG5cdF9wYW5Pck1vdmVNYWluU2Nyb2xsID0gZnVuY3Rpb24oYXhpcywgZGVsdGEpIHtcclxuXHJcblx0XHR2YXIgcGFuRnJpY3Rpb24sXHJcblx0XHRcdG92ZXJEaWZmID0gMCxcclxuXHRcdFx0bmV3T2Zmc2V0ID0gX3Bhbk9mZnNldFtheGlzXSArIGRlbHRhW2F4aXNdLFxyXG5cdFx0XHRzdGFydE92ZXJEaWZmLFxyXG5cdFx0XHRkaXIgPSBkZWx0YVtheGlzXSA+IDAsXHJcblx0XHRcdG5ld01haW5TY3JvbGxQb3NpdGlvbiA9IF9tYWluU2Nyb2xsUG9zLnggKyBkZWx0YS54LFxyXG5cdFx0XHRtYWluU2Nyb2xsRGlmZiA9IF9tYWluU2Nyb2xsUG9zLnggLSBfc3RhcnRNYWluU2Nyb2xsUG9zLngsXHJcblx0XHRcdG5ld1BhblBvcyxcclxuXHRcdFx0bmV3TWFpblNjcm9sbFBvcztcclxuXHJcblx0XHQvLyBjYWxjdWxhdGUgZmRpc3RhbmNlIG92ZXIgdGhlIGJvdW5kcyBhbmQgZnJpY3Rpb25cclxuXHRcdGlmKG5ld09mZnNldCA+IF9jdXJyUGFuQm91bmRzLm1pbltheGlzXSB8fCBuZXdPZmZzZXQgPCBfY3VyclBhbkJvdW5kcy5tYXhbYXhpc10pIHtcclxuXHRcdFx0cGFuRnJpY3Rpb24gPSBfb3B0aW9ucy5wYW5FbmRGcmljdGlvbjtcclxuXHRcdFx0Ly8gTGluZWFyIGluY3JlYXNpbmcgb2YgZnJpY3Rpb24sIHNvIGF0IDEvNCBvZiB2aWV3cG9ydCBpdCdzIGF0IG1heCB2YWx1ZS4gXHJcblx0XHRcdC8vIExvb2tzIG5vdCBhcyBuaWNlIGFzIHdhcyBleHBlY3RlZC4gTGVmdCBmb3IgaGlzdG9yeS5cclxuXHRcdFx0Ly8gcGFuRnJpY3Rpb24gPSAoMSAtIChfcGFuT2Zmc2V0W2F4aXNdICsgZGVsdGFbYXhpc10gKyBwYW5Cb3VuZHMubWluW2F4aXNdKSAvIChfdmlld3BvcnRTaXplW2F4aXNdIC8gNCkgKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHBhbkZyaWN0aW9uID0gMTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0bmV3T2Zmc2V0ID0gX3Bhbk9mZnNldFtheGlzXSArIGRlbHRhW2F4aXNdICogcGFuRnJpY3Rpb247XHJcblxyXG5cdFx0Ly8gbW92ZSBtYWluIHNjcm9sbCBvciBzdGFydCBwYW5uaW5nXHJcblx0XHRpZihfb3B0aW9ucy5hbGxvd1BhblRvTmV4dCB8fCBfY3Vyclpvb21MZXZlbCA9PT0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsKSB7XHJcblxyXG5cclxuXHRcdFx0aWYoIV9jdXJyWm9vbUVsZW1lbnRTdHlsZSkge1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XHJcblxyXG5cdFx0XHR9IGVsc2UgaWYoX2RpcmVjdGlvbiA9PT0gJ2gnICYmIGF4aXMgPT09ICd4JyAmJiAhX3pvb21TdGFydGVkICkge1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmKGRpcikge1xyXG5cdFx0XHRcdFx0aWYobmV3T2Zmc2V0ID4gX2N1cnJQYW5Cb3VuZHMubWluW2F4aXNdKSB7XHJcblx0XHRcdFx0XHRcdHBhbkZyaWN0aW9uID0gX29wdGlvbnMucGFuRW5kRnJpY3Rpb247XHJcblx0XHRcdFx0XHRcdG92ZXJEaWZmID0gX2N1cnJQYW5Cb3VuZHMubWluW2F4aXNdIC0gbmV3T2Zmc2V0O1xyXG5cdFx0XHRcdFx0XHRzdGFydE92ZXJEaWZmID0gX2N1cnJQYW5Cb3VuZHMubWluW2F4aXNdIC0gX3N0YXJ0UGFuT2Zmc2V0W2F4aXNdO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQvLyBkcmFnIHJpZ2h0XHJcblx0XHRcdFx0XHRpZiggKHN0YXJ0T3ZlckRpZmYgPD0gMCB8fCBtYWluU2Nyb2xsRGlmZiA8IDApICYmIF9nZXROdW1JdGVtcygpID4gMSApIHtcclxuXHRcdFx0XHRcdFx0bmV3TWFpblNjcm9sbFBvcyA9IG5ld01haW5TY3JvbGxQb3NpdGlvbjtcclxuXHRcdFx0XHRcdFx0aWYobWFpblNjcm9sbERpZmYgPCAwICYmIG5ld01haW5TY3JvbGxQb3NpdGlvbiA+IF9zdGFydE1haW5TY3JvbGxQb3MueCkge1xyXG5cdFx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBfc3RhcnRNYWluU2Nyb2xsUG9zLng7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGlmKF9jdXJyUGFuQm91bmRzLm1pbi54ICE9PSBfY3VyclBhbkJvdW5kcy5tYXgueCkge1xyXG5cdFx0XHRcdFx0XHRcdG5ld1BhblBvcyA9IG5ld09mZnNldDtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0XHRpZihuZXdPZmZzZXQgPCBfY3VyclBhbkJvdW5kcy5tYXhbYXhpc10gKSB7XHJcblx0XHRcdFx0XHRcdHBhbkZyaWN0aW9uID1fb3B0aW9ucy5wYW5FbmRGcmljdGlvbjtcclxuXHRcdFx0XHRcdFx0b3ZlckRpZmYgPSBuZXdPZmZzZXQgLSBfY3VyclBhbkJvdW5kcy5tYXhbYXhpc107XHJcblx0XHRcdFx0XHRcdHN0YXJ0T3ZlckRpZmYgPSBfc3RhcnRQYW5PZmZzZXRbYXhpc10gLSBfY3VyclBhbkJvdW5kcy5tYXhbYXhpc107XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYoIChzdGFydE92ZXJEaWZmIDw9IDAgfHwgbWFpblNjcm9sbERpZmYgPiAwKSAmJiBfZ2V0TnVtSXRlbXMoKSA+IDEgKSB7XHJcblx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XHJcblxyXG5cdFx0XHRcdFx0XHRpZihtYWluU2Nyb2xsRGlmZiA+IDAgJiYgbmV3TWFpblNjcm9sbFBvc2l0aW9uIDwgX3N0YXJ0TWFpblNjcm9sbFBvcy54KSB7XHJcblx0XHRcdFx0XHRcdFx0bmV3TWFpblNjcm9sbFBvcyA9IF9zdGFydE1haW5TY3JvbGxQb3MueDtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGlmKF9jdXJyUGFuQm91bmRzLm1pbi54ICE9PSBfY3VyclBhbkJvdW5kcy5tYXgueCkge1xyXG5cdFx0XHRcdFx0XHRcdG5ld1BhblBvcyA9IG5ld09mZnNldDtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0XHQvL1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZihheGlzID09PSAneCcpIHtcclxuXHJcblx0XHRcdFx0aWYobmV3TWFpblNjcm9sbFBvcyAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRfbW92ZU1haW5TY3JvbGwobmV3TWFpblNjcm9sbFBvcywgdHJ1ZSk7XHJcblx0XHRcdFx0XHRpZihuZXdNYWluU2Nyb2xsUG9zID09PSBfc3RhcnRNYWluU2Nyb2xsUG9zLngpIHtcclxuXHRcdFx0XHRcdFx0X21haW5TY3JvbGxTaGlmdGVkID0gZmFsc2U7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRfbWFpblNjcm9sbFNoaWZ0ZWQgPSB0cnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYoX2N1cnJQYW5Cb3VuZHMubWluLnggIT09IF9jdXJyUGFuQm91bmRzLm1heC54KSB7XHJcblx0XHRcdFx0XHRpZihuZXdQYW5Qb3MgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggPSBuZXdQYW5Qb3M7XHJcblx0XHRcdFx0XHR9IGVsc2UgaWYoIV9tYWluU2Nyb2xsU2hpZnRlZCkge1xyXG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggKz0gZGVsdGEueCAqIHBhbkZyaWN0aW9uO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIG5ld01haW5TY3JvbGxQb3MgIT09IHVuZGVmaW5lZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRpZighX21haW5TY3JvbGxBbmltYXRpbmcpIHtcclxuXHRcdFx0XHJcblx0XHRcdGlmKCFfbWFpblNjcm9sbFNoaWZ0ZWQpIHtcclxuXHRcdFx0XHRpZihfY3Vyclpvb21MZXZlbCA+IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pIHtcclxuXHRcdFx0XHRcdF9wYW5PZmZzZXRbYXhpc10gKz0gZGVsdGFbYXhpc10gKiBwYW5GcmljdGlvbjtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdFx0XHJcblx0fSxcclxuXHJcblx0Ly8gUG9pbnRlcmRvd24vdG91Y2hzdGFydC9tb3VzZWRvd24gaGFuZGxlclxyXG5cdF9vbkRyYWdTdGFydCA9IGZ1bmN0aW9uKGUpIHtcclxuXHJcblx0XHQvLyBBbGxvdyBkcmFnZ2luZyBvbmx5IHZpYSBsZWZ0IG1vdXNlIGJ1dHRvbi5cclxuXHRcdC8vIEFzIHRoaXMgaGFuZGxlciBpcyBub3QgYWRkZWQgaW4gSUU4IC0gd2UgaWdub3JlIGUud2hpY2hcclxuXHRcdC8vIFxyXG5cdFx0Ly8gaHR0cDovL3d3dy5xdWlya3Ntb2RlLm9yZy9qcy9ldmVudHNfcHJvcGVydGllcy5odG1sXHJcblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvZXZlbnQuYnV0dG9uXHJcblx0XHRpZihlLnR5cGUgPT09ICdtb3VzZWRvd24nICYmIGUuYnV0dG9uID4gMCAgKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRpZihfaW5pdGlhbFpvb21SdW5uaW5nKSB7XHJcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKF9vbGRBbmRyb2lkVG91Y2hFbmRUaW1lb3V0ICYmIGUudHlwZSA9PT0gJ21vdXNlZG93bicpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKF9wcmV2ZW50RGVmYXVsdEV2ZW50QmVoYXZpb3VyKGUsIHRydWUpKSB7XHJcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdF9zaG91dCgncG9pbnRlckRvd24nKTtcclxuXHJcblx0XHRpZihfcG9pbnRlckV2ZW50RW5hYmxlZCkge1xyXG5cdFx0XHR2YXIgcG9pbnRlckluZGV4ID0gZnJhbWV3b3JrLmFycmF5U2VhcmNoKF9jdXJyUG9pbnRlcnMsIGUucG9pbnRlcklkLCAnaWQnKTtcclxuXHRcdFx0aWYocG9pbnRlckluZGV4IDwgMCkge1xyXG5cdFx0XHRcdHBvaW50ZXJJbmRleCA9IF9jdXJyUG9pbnRlcnMubGVuZ3RoO1xyXG5cdFx0XHR9XHJcblx0XHRcdF9jdXJyUG9pbnRlcnNbcG9pbnRlckluZGV4XSA9IHt4OmUucGFnZVgsIHk6ZS5wYWdlWSwgaWQ6IGUucG9pbnRlcklkfTtcclxuXHRcdH1cclxuXHRcdFxyXG5cclxuXHJcblx0XHR2YXIgc3RhcnRQb2ludHNMaXN0ID0gX2dldFRvdWNoUG9pbnRzKGUpLFxyXG5cdFx0XHRudW1Qb2ludHMgPSBzdGFydFBvaW50c0xpc3QubGVuZ3RoO1xyXG5cclxuXHRcdF9jdXJyZW50UG9pbnRzID0gbnVsbDtcclxuXHJcblx0XHRfc3RvcEFsbEFuaW1hdGlvbnMoKTtcclxuXHJcblx0XHQvLyBpbml0IGRyYWdcclxuXHRcdGlmKCFfaXNEcmFnZ2luZyB8fCBudW1Qb2ludHMgPT09IDEpIHtcclxuXHJcblx0XHRcdFxyXG5cclxuXHRcdFx0X2lzRHJhZ2dpbmcgPSBfaXNGaXJzdE1vdmUgPSB0cnVlO1xyXG5cdFx0XHRmcmFtZXdvcmsuYmluZCh3aW5kb3csIF91cE1vdmVFdmVudHMsIHNlbGYpO1xyXG5cclxuXHRcdFx0X2lzWm9vbWluZ0luID0gXHJcblx0XHRcdFx0X3dhc092ZXJJbml0aWFsWm9vbSA9IFxyXG5cdFx0XHRcdF9vcGFjaXR5Q2hhbmdlZCA9IFxyXG5cdFx0XHRcdF92ZXJ0aWNhbERyYWdJbml0aWF0ZWQgPSBcclxuXHRcdFx0XHRfbWFpblNjcm9sbFNoaWZ0ZWQgPSBcclxuXHRcdFx0XHRfbW92ZWQgPSBcclxuXHRcdFx0XHRfaXNNdWx0aXRvdWNoID0gXHJcblx0XHRcdFx0X3pvb21TdGFydGVkID0gZmFsc2U7XHJcblxyXG5cdFx0XHRfZGlyZWN0aW9uID0gbnVsbDtcclxuXHJcblx0XHRcdF9zaG91dCgnZmlyc3RUb3VjaFN0YXJ0Jywgc3RhcnRQb2ludHNMaXN0KTtcclxuXHJcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfc3RhcnRQYW5PZmZzZXQsIF9wYW5PZmZzZXQpO1xyXG5cclxuXHRcdFx0X2N1cnJQYW5EaXN0LnggPSBfY3VyclBhbkRpc3QueSA9IDA7XHJcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfY3VyclBvaW50LCBzdGFydFBvaW50c0xpc3RbMF0pO1xyXG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX3N0YXJ0UG9pbnQsIF9jdXJyUG9pbnQpO1xyXG5cclxuXHRcdFx0Ly9fZXF1YWxpemVQb2ludHMoX3N0YXJ0TWFpblNjcm9sbFBvcywgX21haW5TY3JvbGxQb3MpO1xyXG5cdFx0XHRfc3RhcnRNYWluU2Nyb2xsUG9zLnggPSBfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXg7XHJcblxyXG5cdFx0XHRfcG9zUG9pbnRzID0gW3tcclxuXHRcdFx0XHR4OiBfY3VyclBvaW50LngsXHJcblx0XHRcdFx0eTogX2N1cnJQb2ludC55XHJcblx0XHRcdH1dO1xyXG5cclxuXHRcdFx0X2dlc3R1cmVDaGVja1NwZWVkVGltZSA9IF9nZXN0dXJlU3RhcnRUaW1lID0gX2dldEN1cnJlbnRUaW1lKCk7XHJcblxyXG5cdFx0XHQvL19tYWluU2Nyb2xsQW5pbWF0aW9uRW5kKHRydWUpO1xyXG5cdFx0XHRfY2FsY3VsYXRlUGFuQm91bmRzKCBfY3Vyclpvb21MZXZlbCwgdHJ1ZSApO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gU3RhcnQgcmVuZGVyaW5nXHJcblx0XHRcdF9zdG9wRHJhZ1VwZGF0ZUxvb3AoKTtcclxuXHRcdFx0X2RyYWdVcGRhdGVMb29wKCk7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGluaXQgem9vbVxyXG5cdFx0aWYoIV9pc1pvb21pbmcgJiYgbnVtUG9pbnRzID4gMSAmJiAhX21haW5TY3JvbGxBbmltYXRpbmcgJiYgIV9tYWluU2Nyb2xsU2hpZnRlZCkge1xyXG5cdFx0XHRfc3RhcnRab29tTGV2ZWwgPSBfY3Vyclpvb21MZXZlbDtcclxuXHRcdFx0X3pvb21TdGFydGVkID0gZmFsc2U7IC8vIHRydWUgaWYgem9vbSBjaGFuZ2VkIGF0IGxlYXN0IG9uY2VcclxuXHJcblx0XHRcdF9pc1pvb21pbmcgPSBfaXNNdWx0aXRvdWNoID0gdHJ1ZTtcclxuXHRcdFx0X2N1cnJQYW5EaXN0LnkgPSBfY3VyclBhbkRpc3QueCA9IDA7XHJcblxyXG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX3N0YXJ0UGFuT2Zmc2V0LCBfcGFuT2Zmc2V0KTtcclxuXHJcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhwLCBzdGFydFBvaW50c0xpc3RbMF0pO1xyXG5cdFx0XHRfZXF1YWxpemVQb2ludHMocDIsIHN0YXJ0UG9pbnRzTGlzdFsxXSk7XHJcblxyXG5cdFx0XHRfZmluZENlbnRlck9mUG9pbnRzKHAsIHAyLCBfY3VyckNlbnRlclBvaW50KTtcclxuXHJcblx0XHRcdF9taWRab29tUG9pbnQueCA9IE1hdGguYWJzKF9jdXJyQ2VudGVyUG9pbnQueCkgLSBfcGFuT2Zmc2V0Lng7XHJcblx0XHRcdF9taWRab29tUG9pbnQueSA9IE1hdGguYWJzKF9jdXJyQ2VudGVyUG9pbnQueSkgLSBfcGFuT2Zmc2V0Lnk7XHJcblx0XHRcdF9jdXJyUG9pbnRzRGlzdGFuY2UgPSBfc3RhcnRQb2ludHNEaXN0YW5jZSA9IF9jYWxjdWxhdGVQb2ludHNEaXN0YW5jZShwLCBwMik7XHJcblx0XHR9XHJcblxyXG5cclxuXHR9LFxyXG5cclxuXHQvLyBQb2ludGVybW92ZS90b3VjaG1vdmUvbW91c2Vtb3ZlIGhhbmRsZXJcclxuXHRfb25EcmFnTW92ZSA9IGZ1bmN0aW9uKGUpIHtcclxuXHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0aWYoX3BvaW50ZXJFdmVudEVuYWJsZWQpIHtcclxuXHRcdFx0dmFyIHBvaW50ZXJJbmRleCA9IGZyYW1ld29yay5hcnJheVNlYXJjaChfY3VyclBvaW50ZXJzLCBlLnBvaW50ZXJJZCwgJ2lkJyk7XHJcblx0XHRcdGlmKHBvaW50ZXJJbmRleCA+IC0xKSB7XHJcblx0XHRcdFx0dmFyIHAgPSBfY3VyclBvaW50ZXJzW3BvaW50ZXJJbmRleF07XHJcblx0XHRcdFx0cC54ID0gZS5wYWdlWDtcclxuXHRcdFx0XHRwLnkgPSBlLnBhZ2VZOyBcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmKF9pc0RyYWdnaW5nKSB7XHJcblx0XHRcdHZhciB0b3VjaGVzTGlzdCA9IF9nZXRUb3VjaFBvaW50cyhlKTtcclxuXHRcdFx0aWYoIV9kaXJlY3Rpb24gJiYgIV9tb3ZlZCAmJiAhX2lzWm9vbWluZykge1xyXG5cclxuXHRcdFx0XHRpZihfbWFpblNjcm9sbFBvcy54ICE9PSBfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXgpIHtcclxuXHRcdFx0XHRcdC8vIGlmIG1haW4gc2Nyb2xsIHBvc2l0aW9uIGlzIHNoaWZ0ZWQg4oCTIGRpcmVjdGlvbiBpcyBhbHdheXMgaG9yaXpvbnRhbFxyXG5cdFx0XHRcdFx0X2RpcmVjdGlvbiA9ICdoJztcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dmFyIGRpZmYgPSBNYXRoLmFicyh0b3VjaGVzTGlzdFswXS54IC0gX2N1cnJQb2ludC54KSAtIE1hdGguYWJzKHRvdWNoZXNMaXN0WzBdLnkgLSBfY3VyclBvaW50LnkpO1xyXG5cdFx0XHRcdFx0Ly8gY2hlY2sgdGhlIGRpcmVjdGlvbiBvZiBtb3ZlbWVudFxyXG5cdFx0XHRcdFx0aWYoTWF0aC5hYnMoZGlmZikgPj0gRElSRUNUSU9OX0NIRUNLX09GRlNFVCkge1xyXG5cdFx0XHRcdFx0XHRfZGlyZWN0aW9uID0gZGlmZiA+IDAgPyAnaCcgOiAndic7XHJcblx0XHRcdFx0XHRcdF9jdXJyZW50UG9pbnRzID0gdG91Y2hlc0xpc3Q7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdF9jdXJyZW50UG9pbnRzID0gdG91Y2hlc0xpc3Q7XHJcblx0XHRcdH1cclxuXHRcdH1cdFxyXG5cdH0sXHJcblx0Ly8gXHJcblx0X3JlbmRlck1vdmVtZW50ID0gIGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdGlmKCFfY3VycmVudFBvaW50cykge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG51bVBvaW50cyA9IF9jdXJyZW50UG9pbnRzLmxlbmd0aDtcclxuXHJcblx0XHRpZihudW1Qb2ludHMgPT09IDApIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdF9lcXVhbGl6ZVBvaW50cyhwLCBfY3VycmVudFBvaW50c1swXSk7XHJcblxyXG5cdFx0ZGVsdGEueCA9IHAueCAtIF9jdXJyUG9pbnQueDtcclxuXHRcdGRlbHRhLnkgPSBwLnkgLSBfY3VyclBvaW50Lnk7XHJcblxyXG5cdFx0aWYoX2lzWm9vbWluZyAmJiBudW1Qb2ludHMgPiAxKSB7XHJcblx0XHRcdC8vIEhhbmRsZSBiZWhhdmlvdXIgZm9yIG1vcmUgdGhhbiAxIHBvaW50XHJcblxyXG5cdFx0XHRfY3VyclBvaW50LnggPSBwLng7XHJcblx0XHRcdF9jdXJyUG9pbnQueSA9IHAueTtcclxuXHRcdFxyXG5cdFx0XHQvLyBjaGVjayBpZiBvbmUgb2YgdHdvIHBvaW50cyBjaGFuZ2VkXHJcblx0XHRcdGlmKCAhZGVsdGEueCAmJiAhZGVsdGEueSAmJiBfaXNFcXVhbFBvaW50cyhfY3VycmVudFBvaW50c1sxXSwgcDIpICkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0X2VxdWFsaXplUG9pbnRzKHAyLCBfY3VycmVudFBvaW50c1sxXSk7XHJcblxyXG5cclxuXHRcdFx0aWYoIV96b29tU3RhcnRlZCkge1xyXG5cdFx0XHRcdF96b29tU3RhcnRlZCA9IHRydWU7XHJcblx0XHRcdFx0X3Nob3V0KCd6b29tR2VzdHVyZVN0YXJ0ZWQnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Ly8gRGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXHJcblx0XHRcdHZhciBwb2ludHNEaXN0YW5jZSA9IF9jYWxjdWxhdGVQb2ludHNEaXN0YW5jZShwLHAyKTtcclxuXHJcblx0XHRcdHZhciB6b29tTGV2ZWwgPSBfY2FsY3VsYXRlWm9vbUxldmVsKHBvaW50c0Rpc3RhbmNlKTtcclxuXHJcblx0XHRcdC8vIHNsaWdodGx5IG92ZXIgdGhlIG9mIGluaXRpYWwgem9vbSBsZXZlbFxyXG5cdFx0XHRpZih6b29tTGV2ZWwgPiBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgKyBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgLyAxNSkge1xyXG5cdFx0XHRcdF93YXNPdmVySW5pdGlhbFpvb20gPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBBcHBseSB0aGUgZnJpY3Rpb24gaWYgem9vbSBsZXZlbCBpcyBvdXQgb2YgdGhlIGJvdW5kc1xyXG5cdFx0XHR2YXIgem9vbUZyaWN0aW9uID0gMSxcclxuXHRcdFx0XHRtaW5ab29tTGV2ZWwgPSBfZ2V0TWluWm9vbUxldmVsKCksXHJcblx0XHRcdFx0bWF4Wm9vbUxldmVsID0gX2dldE1heFpvb21MZXZlbCgpO1xyXG5cclxuXHRcdFx0aWYgKCB6b29tTGV2ZWwgPCBtaW5ab29tTGV2ZWwgKSB7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYoX29wdGlvbnMucGluY2hUb0Nsb3NlICYmICFfd2FzT3ZlckluaXRpYWxab29tICYmIF9zdGFydFpvb21MZXZlbCA8PSBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwpIHtcclxuXHRcdFx0XHRcdC8vIGZhZGUgb3V0IGJhY2tncm91bmQgaWYgem9vbWluZyBvdXRcclxuXHRcdFx0XHRcdHZhciBtaW51c0RpZmYgPSBtaW5ab29tTGV2ZWwgLSB6b29tTGV2ZWw7XHJcblx0XHRcdFx0XHR2YXIgcGVyY2VudCA9IDEgLSBtaW51c0RpZmYgLyAobWluWm9vbUxldmVsIC8gMS4yKTtcclxuXHJcblx0XHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkocGVyY2VudCk7XHJcblx0XHRcdFx0XHRfc2hvdXQoJ29uUGluY2hDbG9zZScsIHBlcmNlbnQpO1xyXG5cdFx0XHRcdFx0X29wYWNpdHlDaGFuZ2VkID0gdHJ1ZTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0em9vbUZyaWN0aW9uID0gKG1pblpvb21MZXZlbCAtIHpvb21MZXZlbCkgLyBtaW5ab29tTGV2ZWw7XHJcblx0XHRcdFx0XHRpZih6b29tRnJpY3Rpb24gPiAxKSB7XHJcblx0XHRcdFx0XHRcdHpvb21GcmljdGlvbiA9IDE7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR6b29tTGV2ZWwgPSBtaW5ab29tTGV2ZWwgLSB6b29tRnJpY3Rpb24gKiAobWluWm9vbUxldmVsIC8gMyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9IGVsc2UgaWYgKCB6b29tTGV2ZWwgPiBtYXhab29tTGV2ZWwgKSB7XHJcblx0XHRcdFx0Ly8gMS41IC0gZXh0cmEgem9vbSBsZXZlbCBhYm92ZSB0aGUgbWF4LiBFLmcuIGlmIG1heCBpcyB4NiwgcmVhbCBtYXggNiArIDEuNSA9IDcuNVxyXG5cdFx0XHRcdHpvb21GcmljdGlvbiA9ICh6b29tTGV2ZWwgLSBtYXhab29tTGV2ZWwpIC8gKCBtaW5ab29tTGV2ZWwgKiA2ICk7XHJcblx0XHRcdFx0aWYoem9vbUZyaWN0aW9uID4gMSkge1xyXG5cdFx0XHRcdFx0em9vbUZyaWN0aW9uID0gMTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0em9vbUxldmVsID0gbWF4Wm9vbUxldmVsICsgem9vbUZyaWN0aW9uICogbWluWm9vbUxldmVsO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZih6b29tRnJpY3Rpb24gPCAwKSB7XHJcblx0XHRcdFx0em9vbUZyaWN0aW9uID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gZGlzdGFuY2UgYmV0d2VlbiB0b3VjaCBwb2ludHMgYWZ0ZXIgZnJpY3Rpb24gaXMgYXBwbGllZFxyXG5cdFx0XHRfY3VyclBvaW50c0Rpc3RhbmNlID0gcG9pbnRzRGlzdGFuY2U7XHJcblxyXG5cdFx0XHQvLyBfY2VudGVyUG9pbnQgLSBUaGUgcG9pbnQgaW4gdGhlIG1pZGRsZSBvZiB0d28gcG9pbnRlcnNcclxuXHRcdFx0X2ZpbmRDZW50ZXJPZlBvaW50cyhwLCBwMiwgX2NlbnRlclBvaW50KTtcclxuXHRcdFxyXG5cdFx0XHQvLyBwYW5pbmcgd2l0aCB0d28gcG9pbnRlcnMgcHJlc3NlZFxyXG5cdFx0XHRfY3VyclBhbkRpc3QueCArPSBfY2VudGVyUG9pbnQueCAtIF9jdXJyQ2VudGVyUG9pbnQueDtcclxuXHRcdFx0X2N1cnJQYW5EaXN0LnkgKz0gX2NlbnRlclBvaW50LnkgLSBfY3VyckNlbnRlclBvaW50Lnk7XHJcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfY3VyckNlbnRlclBvaW50LCBfY2VudGVyUG9pbnQpO1xyXG5cclxuXHRcdFx0X3Bhbk9mZnNldC54ID0gX2NhbGN1bGF0ZVBhbk9mZnNldCgneCcsIHpvb21MZXZlbCk7XHJcblx0XHRcdF9wYW5PZmZzZXQueSA9IF9jYWxjdWxhdGVQYW5PZmZzZXQoJ3knLCB6b29tTGV2ZWwpO1xyXG5cclxuXHRcdFx0X2lzWm9vbWluZ0luID0gem9vbUxldmVsID4gX2N1cnJab29tTGV2ZWw7XHJcblx0XHRcdF9jdXJyWm9vbUxldmVsID0gem9vbUxldmVsO1xyXG5cdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xyXG5cclxuXHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHQvLyBoYW5kbGUgYmVoYXZpb3VyIGZvciBvbmUgcG9pbnQgKGRyYWdnaW5nIG9yIHBhbm5pbmcpXHJcblxyXG5cdFx0XHRpZighX2RpcmVjdGlvbikge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoX2lzRmlyc3RNb3ZlKSB7XHJcblx0XHRcdFx0X2lzRmlyc3RNb3ZlID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdC8vIHN1YnRyYWN0IGRyYWcgZGlzdGFuY2UgdGhhdCB3YXMgdXNlZCBkdXJpbmcgdGhlIGRldGVjdGlvbiBkaXJlY3Rpb24gIFxyXG5cclxuXHRcdFx0XHRpZiggTWF0aC5hYnMoZGVsdGEueCkgPj0gRElSRUNUSU9OX0NIRUNLX09GRlNFVCkge1xyXG5cdFx0XHRcdFx0ZGVsdGEueCAtPSBfY3VycmVudFBvaW50c1swXS54IC0gX3N0YXJ0UG9pbnQueDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYoIE1hdGguYWJzKGRlbHRhLnkpID49IERJUkVDVElPTl9DSEVDS19PRkZTRVQpIHtcclxuXHRcdFx0XHRcdGRlbHRhLnkgLT0gX2N1cnJlbnRQb2ludHNbMF0ueSAtIF9zdGFydFBvaW50Lnk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRfY3VyclBvaW50LnggPSBwLng7XHJcblx0XHRcdF9jdXJyUG9pbnQueSA9IHAueTtcclxuXHJcblx0XHRcdC8vIGRvIG5vdGhpbmcgaWYgcG9pbnRlcnMgcG9zaXRpb24gaGFzbid0IGNoYW5nZWRcclxuXHRcdFx0aWYoZGVsdGEueCA9PT0gMCAmJiBkZWx0YS55ID09PSAwKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZihfZGlyZWN0aW9uID09PSAndicgJiYgX29wdGlvbnMuY2xvc2VPblZlcnRpY2FsRHJhZykge1xyXG5cdFx0XHRcdGlmKCFfY2FuUGFuKCkpIHtcclxuXHRcdFx0XHRcdF9jdXJyUGFuRGlzdC55ICs9IGRlbHRhLnk7XHJcblx0XHRcdFx0XHRfcGFuT2Zmc2V0LnkgKz0gZGVsdGEueTtcclxuXHJcblx0XHRcdFx0XHR2YXIgb3BhY2l0eVJhdGlvID0gX2NhbGN1bGF0ZVZlcnRpY2FsRHJhZ09wYWNpdHlSYXRpbygpO1xyXG5cclxuXHRcdFx0XHRcdF92ZXJ0aWNhbERyYWdJbml0aWF0ZWQgPSB0cnVlO1xyXG5cdFx0XHRcdFx0X3Nob3V0KCdvblZlcnRpY2FsRHJhZycsIG9wYWNpdHlSYXRpbyk7XHJcblxyXG5cdFx0XHRcdFx0X2FwcGx5QmdPcGFjaXR5KG9wYWNpdHlSYXRpbyk7XHJcblx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdF9wdXNoUG9zUG9pbnQoX2dldEN1cnJlbnRUaW1lKCksIHAueCwgcC55KTtcclxuXHJcblx0XHRcdF9tb3ZlZCA9IHRydWU7XHJcblx0XHRcdF9jdXJyUGFuQm91bmRzID0gc2VsZi5jdXJySXRlbS5ib3VuZHM7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgbWFpblNjcm9sbENoYW5nZWQgPSBfcGFuT3JNb3ZlTWFpblNjcm9sbCgneCcsIGRlbHRhKTtcclxuXHRcdFx0aWYoIW1haW5TY3JvbGxDaGFuZ2VkKSB7XHJcblx0XHRcdFx0X3Bhbk9yTW92ZU1haW5TY3JvbGwoJ3knLCBkZWx0YSk7XHJcblxyXG5cdFx0XHRcdF9yb3VuZFBvaW50KF9wYW5PZmZzZXQpO1xyXG5cdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdH0sXHJcblx0XHJcblx0Ly8gUG9pbnRlcnVwL3BvaW50ZXJjYW5jZWwvdG91Y2hlbmQvdG91Y2hjYW5jZWwvbW91c2V1cCBldmVudCBoYW5kbGVyXHJcblx0X29uRHJhZ1JlbGVhc2UgPSBmdW5jdGlvbihlKSB7XHJcblxyXG5cdFx0aWYoX2ZlYXR1cmVzLmlzT2xkQW5kcm9pZCApIHtcclxuXHJcblx0XHRcdGlmKF9vbGRBbmRyb2lkVG91Y2hFbmRUaW1lb3V0ICYmIGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBvbiBBbmRyb2lkICh2NC4xLCA0LjIsIDQuMyAmIHBvc3NpYmx5IG9sZGVyKSBcclxuXHRcdFx0Ly8gZ2hvc3QgbW91c2Vkb3duL3VwIGV2ZW50IGlzbid0IHByZXZlbnRhYmxlIHZpYSBlLnByZXZlbnREZWZhdWx0LFxyXG5cdFx0XHQvLyB3aGljaCBjYXVzZXMgZmFrZSBtb3VzZWRvd24gZXZlbnRcclxuXHRcdFx0Ly8gc28gd2UgYmxvY2sgbW91c2Vkb3duL3VwIGZvciA2MDBtc1xyXG5cdFx0XHRpZiggZS50eXBlLmluZGV4T2YoJ3RvdWNoJykgPiAtMSApIHtcclxuXHRcdFx0XHRjbGVhclRpbWVvdXQoX29sZEFuZHJvaWRUb3VjaEVuZFRpbWVvdXQpO1xyXG5cdFx0XHRcdF9vbGRBbmRyb2lkVG91Y2hFbmRUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdF9vbGRBbmRyb2lkVG91Y2hFbmRUaW1lb3V0ID0gMDtcclxuXHRcdFx0XHR9LCA2MDApO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdF9zaG91dCgncG9pbnRlclVwJyk7XHJcblxyXG5cdFx0aWYoX3ByZXZlbnREZWZhdWx0RXZlbnRCZWhhdmlvdXIoZSwgZmFsc2UpKSB7XHJcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgcmVsZWFzZVBvaW50O1xyXG5cclxuXHRcdGlmKF9wb2ludGVyRXZlbnRFbmFibGVkKSB7XHJcblx0XHRcdHZhciBwb2ludGVySW5kZXggPSBmcmFtZXdvcmsuYXJyYXlTZWFyY2goX2N1cnJQb2ludGVycywgZS5wb2ludGVySWQsICdpZCcpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYocG9pbnRlckluZGV4ID4gLTEpIHtcclxuXHRcdFx0XHRyZWxlYXNlUG9pbnQgPSBfY3VyclBvaW50ZXJzLnNwbGljZShwb2ludGVySW5kZXgsIDEpWzBdO1xyXG5cclxuXHRcdFx0XHRpZihuYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcclxuXHRcdFx0XHRcdHJlbGVhc2VQb2ludC50eXBlID0gZS5wb2ludGVyVHlwZSB8fCAnbW91c2UnO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR2YXIgTVNQT0lOVEVSX1RZUEVTID0ge1xyXG5cdFx0XHRcdFx0XHQ0OiAnbW91c2UnLCAvLyBldmVudC5NU1BPSU5URVJfVFlQRV9NT1VTRVxyXG5cdFx0XHRcdFx0XHQyOiAndG91Y2gnLCAvLyBldmVudC5NU1BPSU5URVJfVFlQRV9UT1VDSCBcclxuXHRcdFx0XHRcdFx0MzogJ3BlbicgLy8gZXZlbnQuTVNQT0lOVEVSX1RZUEVfUEVOXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0cmVsZWFzZVBvaW50LnR5cGUgPSBNU1BPSU5URVJfVFlQRVNbZS5wb2ludGVyVHlwZV07XHJcblxyXG5cdFx0XHRcdFx0aWYoIXJlbGVhc2VQb2ludC50eXBlKSB7XHJcblx0XHRcdFx0XHRcdHJlbGVhc2VQb2ludC50eXBlID0gZS5wb2ludGVyVHlwZSB8fCAnbW91c2UnO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgdG91Y2hMaXN0ID0gX2dldFRvdWNoUG9pbnRzKGUpLFxyXG5cdFx0XHRnZXN0dXJlVHlwZSxcclxuXHRcdFx0bnVtUG9pbnRzID0gdG91Y2hMaXN0Lmxlbmd0aDtcclxuXHJcblx0XHRpZihlLnR5cGUgPT09ICdtb3VzZXVwJykge1xyXG5cdFx0XHRudW1Qb2ludHMgPSAwO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIERvIG5vdGhpbmcgaWYgdGhlcmUgd2VyZSAzIHRvdWNoIHBvaW50cyBvciBtb3JlXHJcblx0XHRpZihudW1Qb2ludHMgPT09IDIpIHtcclxuXHRcdFx0X2N1cnJlbnRQb2ludHMgPSBudWxsO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBpZiBzZWNvbmQgcG9pbnRlciByZWxlYXNlZFxyXG5cdFx0aWYobnVtUG9pbnRzID09PSAxKSB7XHJcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfc3RhcnRQb2ludCwgdG91Y2hMaXN0WzBdKTtcclxuXHRcdH1cdFx0XHRcdFxyXG5cclxuXHJcblx0XHQvLyBwb2ludGVyIGhhc24ndCBtb3ZlZCwgc2VuZCBcInRhcCByZWxlYXNlXCIgcG9pbnRcclxuXHRcdGlmKG51bVBvaW50cyA9PT0gMCAmJiAhX2RpcmVjdGlvbiAmJiAhX21haW5TY3JvbGxBbmltYXRpbmcpIHtcclxuXHRcdFx0aWYoIXJlbGVhc2VQb2ludCkge1xyXG5cdFx0XHRcdGlmKGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XHJcblx0XHRcdFx0XHRyZWxlYXNlUG9pbnQgPSB7eDogZS5wYWdlWCwgeTogZS5wYWdlWSwgdHlwZTonbW91c2UnfTtcclxuXHRcdFx0XHR9IGVsc2UgaWYoZS5jaGFuZ2VkVG91Y2hlcyAmJiBlLmNoYW5nZWRUb3VjaGVzWzBdKSB7XHJcblx0XHRcdFx0XHRyZWxlYXNlUG9pbnQgPSB7eDogZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCwgeTogZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSwgdHlwZTondG91Y2gnfTtcclxuXHRcdFx0XHR9XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRfc2hvdXQoJ3RvdWNoUmVsZWFzZScsIGUsIHJlbGVhc2VQb2ludCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gRGlmZmVyZW5jZSBpbiB0aW1lIGJldHdlZW4gcmVsZWFzaW5nIG9mIHR3byBsYXN0IHRvdWNoIHBvaW50cyAoem9vbSBnZXN0dXJlKVxyXG5cdFx0dmFyIHJlbGVhc2VUaW1lRGlmZiA9IC0xO1xyXG5cclxuXHRcdC8vIEdlc3R1cmUgY29tcGxldGVkLCBubyBwb2ludGVycyBsZWZ0XHJcblx0XHRpZihudW1Qb2ludHMgPT09IDApIHtcclxuXHRcdFx0X2lzRHJhZ2dpbmcgPSBmYWxzZTtcclxuXHRcdFx0ZnJhbWV3b3JrLnVuYmluZCh3aW5kb3csIF91cE1vdmVFdmVudHMsIHNlbGYpO1xyXG5cclxuXHRcdFx0X3N0b3BEcmFnVXBkYXRlTG9vcCgpO1xyXG5cclxuXHRcdFx0aWYoX2lzWm9vbWluZykge1xyXG5cdFx0XHRcdC8vIFR3byBwb2ludHMgcmVsZWFzZWQgYXQgdGhlIHNhbWUgdGltZVxyXG5cdFx0XHRcdHJlbGVhc2VUaW1lRGlmZiA9IDA7XHJcblx0XHRcdH0gZWxzZSBpZihfbGFzdFJlbGVhc2VUaW1lICE9PSAtMSkge1xyXG5cdFx0XHRcdHJlbGVhc2VUaW1lRGlmZiA9IF9nZXRDdXJyZW50VGltZSgpIC0gX2xhc3RSZWxlYXNlVGltZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0X2xhc3RSZWxlYXNlVGltZSA9IG51bVBvaW50cyA9PT0gMSA/IF9nZXRDdXJyZW50VGltZSgpIDogLTE7XHJcblx0XHRcclxuXHRcdGlmKHJlbGVhc2VUaW1lRGlmZiAhPT0gLTEgJiYgcmVsZWFzZVRpbWVEaWZmIDwgMTUwKSB7XHJcblx0XHRcdGdlc3R1cmVUeXBlID0gJ3pvb20nO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Z2VzdHVyZVR5cGUgPSAnc3dpcGUnO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKF9pc1pvb21pbmcgJiYgbnVtUG9pbnRzIDwgMikge1xyXG5cdFx0XHRfaXNab29taW5nID0gZmFsc2U7XHJcblxyXG5cdFx0XHQvLyBPbmx5IHNlY29uZCBwb2ludCByZWxlYXNlZFxyXG5cdFx0XHRpZihudW1Qb2ludHMgPT09IDEpIHtcclxuXHRcdFx0XHRnZXN0dXJlVHlwZSA9ICd6b29tUG9pbnRlclVwJztcclxuXHRcdFx0fVxyXG5cdFx0XHRfc2hvdXQoJ3pvb21HZXN0dXJlRW5kZWQnKTtcclxuXHRcdH1cclxuXHJcblx0XHRfY3VycmVudFBvaW50cyA9IG51bGw7XHJcblx0XHRpZighX21vdmVkICYmICFfem9vbVN0YXJ0ZWQgJiYgIV9tYWluU2Nyb2xsQW5pbWF0aW5nICYmICFfdmVydGljYWxEcmFnSW5pdGlhdGVkKSB7XHJcblx0XHRcdC8vIG5vdGhpbmcgdG8gYW5pbWF0ZVxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHJcblx0XHRfc3RvcEFsbEFuaW1hdGlvbnMoKTtcclxuXHJcblx0XHRcclxuXHRcdGlmKCFfcmVsZWFzZUFuaW1EYXRhKSB7XHJcblx0XHRcdF9yZWxlYXNlQW5pbURhdGEgPSBfaW5pdERyYWdSZWxlYXNlQW5pbWF0aW9uRGF0YSgpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRfcmVsZWFzZUFuaW1EYXRhLmNhbGN1bGF0ZVN3aXBlU3BlZWQoJ3gnKTtcclxuXHJcblxyXG5cdFx0aWYoX3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCkge1xyXG5cclxuXHRcdFx0dmFyIG9wYWNpdHlSYXRpbyA9IF9jYWxjdWxhdGVWZXJ0aWNhbERyYWdPcGFjaXR5UmF0aW8oKTtcclxuXHJcblx0XHRcdGlmKG9wYWNpdHlSYXRpbyA8IF9vcHRpb25zLnZlcnRpY2FsRHJhZ1JhbmdlKSB7XHJcblx0XHRcdFx0c2VsZi5jbG9zZSgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHZhciBpbml0YWxQYW5ZID0gX3Bhbk9mZnNldC55LFxyXG5cdFx0XHRcdFx0aW5pdGlhbEJnT3BhY2l0eSA9IF9iZ09wYWNpdHk7XHJcblxyXG5cdFx0XHRcdF9hbmltYXRlUHJvcCgndmVydGljYWxEcmFnJywgMCwgMSwgMzAwLCBmcmFtZXdvcmsuZWFzaW5nLmN1YmljLm91dCwgZnVuY3Rpb24obm93KSB7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdF9wYW5PZmZzZXQueSA9IChzZWxmLmN1cnJJdGVtLmluaXRpYWxQb3NpdGlvbi55IC0gaW5pdGFsUGFuWSkgKiBub3cgKyBpbml0YWxQYW5ZO1xyXG5cclxuXHRcdFx0XHRcdF9hcHBseUJnT3BhY2l0eSggICgxIC0gaW5pdGlhbEJnT3BhY2l0eSkgKiBub3cgKyBpbml0aWFsQmdPcGFjaXR5ICk7XHJcblx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRfc2hvdXQoJ29uVmVydGljYWxEcmFnJywgMSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0Ly8gbWFpbiBzY3JvbGwgXHJcblx0XHRpZiggIChfbWFpblNjcm9sbFNoaWZ0ZWQgfHwgX21haW5TY3JvbGxBbmltYXRpbmcpICYmIG51bVBvaW50cyA9PT0gMCkge1xyXG5cdFx0XHR2YXIgaXRlbUNoYW5nZWQgPSBfZmluaXNoU3dpcGVNYWluU2Nyb2xsR2VzdHVyZShnZXN0dXJlVHlwZSwgX3JlbGVhc2VBbmltRGF0YSk7XHJcblx0XHRcdGlmKGl0ZW1DaGFuZ2VkKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGdlc3R1cmVUeXBlID0gJ3pvb21Qb2ludGVyVXAnO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIHByZXZlbnQgem9vbS9wYW4gYW5pbWF0aW9uIHdoZW4gbWFpbiBzY3JvbGwgYW5pbWF0aW9uIHJ1bnNcclxuXHRcdGlmKF9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gQ29tcGxldGUgc2ltcGxlIHpvb20gZ2VzdHVyZSAocmVzZXQgem9vbSBsZXZlbCBpZiBpdCdzIG91dCBvZiB0aGUgYm91bmRzKSAgXHJcblx0XHRpZihnZXN0dXJlVHlwZSAhPT0gJ3N3aXBlJykge1xyXG5cdFx0XHRfY29tcGxldGVab29tR2VzdHVyZSgpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHJcblx0XHQvLyBDb21wbGV0ZSBwYW4gZ2VzdHVyZSBpZiBtYWluIHNjcm9sbCBpcyBub3Qgc2hpZnRlZCwgYW5kIGl0J3MgcG9zc2libGUgdG8gcGFuIGN1cnJlbnQgaW1hZ2VcclxuXHRcdGlmKCFfbWFpblNjcm9sbFNoaWZ0ZWQgJiYgX2N1cnJab29tTGV2ZWwgPiBzZWxmLmN1cnJJdGVtLmZpdFJhdGlvKSB7XHJcblx0XHRcdF9jb21wbGV0ZVBhbkdlc3R1cmUoX3JlbGVhc2VBbmltRGF0YSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblxyXG5cdC8vIFJldHVybnMgb2JqZWN0IHdpdGggZGF0YSBhYm91dCBnZXN0dXJlXHJcblx0Ly8gSXQncyBjcmVhdGVkIG9ubHkgb25jZSBhbmQgdGhlbiByZXVzZWRcclxuXHRfaW5pdERyYWdSZWxlYXNlQW5pbWF0aW9uRGF0YSAgPSBmdW5jdGlvbigpIHtcclxuXHRcdC8vIHRlbXAgbG9jYWwgdmFyc1xyXG5cdFx0dmFyIGxhc3RGbGlja0R1cmF0aW9uLFxyXG5cdFx0XHR0ZW1wUmVsZWFzZVBvcztcclxuXHJcblx0XHQvLyBzID0gdGhpc1xyXG5cdFx0dmFyIHMgPSB7XHJcblx0XHRcdGxhc3RGbGlja09mZnNldDoge30sXHJcblx0XHRcdGxhc3RGbGlja0Rpc3Q6IHt9LFxyXG5cdFx0XHRsYXN0RmxpY2tTcGVlZDoge30sXHJcblx0XHRcdHNsb3dEb3duUmF0aW86ICB7fSxcclxuXHRcdFx0c2xvd0Rvd25SYXRpb1JldmVyc2U6ICB7fSxcclxuXHRcdFx0c3BlZWREZWNlbGVyYXRpb25SYXRpbzogIHt9LFxyXG5cdFx0XHRzcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzOiAge30sXHJcblx0XHRcdGRpc3RhbmNlT2Zmc2V0OiAge30sXHJcblx0XHRcdGJhY2tBbmltRGVzdGluYXRpb246IHt9LFxyXG5cdFx0XHRiYWNrQW5pbVN0YXJ0ZWQ6IHt9LFxyXG5cdFx0XHRjYWxjdWxhdGVTd2lwZVNwZWVkOiBmdW5jdGlvbihheGlzKSB7XHJcblx0XHRcdFx0XHJcblxyXG5cdFx0XHRcdGlmKCBfcG9zUG9pbnRzLmxlbmd0aCA+IDEpIHtcclxuXHRcdFx0XHRcdGxhc3RGbGlja0R1cmF0aW9uID0gX2dldEN1cnJlbnRUaW1lKCkgLSBfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lICsgNTA7XHJcblx0XHRcdFx0XHR0ZW1wUmVsZWFzZVBvcyA9IF9wb3NQb2ludHNbX3Bvc1BvaW50cy5sZW5ndGgtMl1bYXhpc107XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGxhc3RGbGlja0R1cmF0aW9uID0gX2dldEN1cnJlbnRUaW1lKCkgLSBfZ2VzdHVyZVN0YXJ0VGltZTsgLy8gdG90YWwgZ2VzdHVyZSBkdXJhdGlvblxyXG5cdFx0XHRcdFx0dGVtcFJlbGVhc2VQb3MgPSBfc3RhcnRQb2ludFtheGlzXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cy5sYXN0RmxpY2tPZmZzZXRbYXhpc10gPSBfY3VyclBvaW50W2F4aXNdIC0gdGVtcFJlbGVhc2VQb3M7XHJcblx0XHRcdFx0cy5sYXN0RmxpY2tEaXN0W2F4aXNdID0gTWF0aC5hYnMocy5sYXN0RmxpY2tPZmZzZXRbYXhpc10pO1xyXG5cdFx0XHRcdGlmKHMubGFzdEZsaWNrRGlzdFtheGlzXSA+IDIwKSB7XHJcblx0XHRcdFx0XHRzLmxhc3RGbGlja1NwZWVkW2F4aXNdID0gcy5sYXN0RmxpY2tPZmZzZXRbYXhpc10gLyBsYXN0RmxpY2tEdXJhdGlvbjtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cy5sYXN0RmxpY2tTcGVlZFtheGlzXSA9IDA7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKCBNYXRoLmFicyhzLmxhc3RGbGlja1NwZWVkW2F4aXNdKSA8IDAuMSApIHtcclxuXHRcdFx0XHRcdHMubGFzdEZsaWNrU3BlZWRbYXhpc10gPSAwO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRzLnNsb3dEb3duUmF0aW9bYXhpc10gPSAwLjk1O1xyXG5cdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gPSAxIC0gcy5zbG93RG93blJhdGlvW2F4aXNdO1xyXG5cdFx0XHRcdHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSA9IDE7XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRjYWxjdWxhdGVPdmVyQm91bmRzQW5pbU9mZnNldDogZnVuY3Rpb24oYXhpcywgc3BlZWQpIHtcclxuXHRcdFx0XHRpZighcy5iYWNrQW5pbVN0YXJ0ZWRbYXhpc10pIHtcclxuXHJcblx0XHRcdFx0XHRpZihfcGFuT2Zmc2V0W2F4aXNdID4gX2N1cnJQYW5Cb3VuZHMubWluW2F4aXNdKSB7XHJcblx0XHRcdFx0XHRcdHMuYmFja0FuaW1EZXN0aW5hdGlvbltheGlzXSA9IF9jdXJyUGFuQm91bmRzLm1pbltheGlzXTtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9IGVsc2UgaWYoX3Bhbk9mZnNldFtheGlzXSA8IF9jdXJyUGFuQm91bmRzLm1heFtheGlzXSkge1xyXG5cdFx0XHRcdFx0XHRzLmJhY2tBbmltRGVzdGluYXRpb25bYXhpc10gPSBfY3VyclBhbkJvdW5kcy5tYXhbYXhpc107XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYocy5iYWNrQW5pbURlc3RpbmF0aW9uW2F4aXNdICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0cy5zbG93RG93blJhdGlvW2F4aXNdID0gMC43O1xyXG5cdFx0XHRcdFx0XHRzLnNsb3dEb3duUmF0aW9SZXZlcnNlW2F4aXNdID0gMSAtIHMuc2xvd0Rvd25SYXRpb1theGlzXTtcclxuXHRcdFx0XHRcdFx0aWYocy5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzW2F4aXNdIDwgMC4wNSkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHRzLmxhc3RGbGlja1NwZWVkW2F4aXNdID0gMDtcclxuXHRcdFx0XHRcdFx0XHRzLmJhY2tBbmltU3RhcnRlZFtheGlzXSA9IHRydWU7XHJcblxyXG5cdFx0XHRcdFx0XHRcdF9hbmltYXRlUHJvcCgnYm91bmNlWm9vbVBhbicrYXhpcyxfcGFuT2Zmc2V0W2F4aXNdLCBcclxuXHRcdFx0XHRcdFx0XHRcdHMuYmFja0FuaW1EZXN0aW5hdGlvbltheGlzXSwgXHJcblx0XHRcdFx0XHRcdFx0XHRzcGVlZCB8fCAzMDAsIFxyXG5cdFx0XHRcdFx0XHRcdFx0ZnJhbWV3b3JrLmVhc2luZy5zaW5lLm91dCwgXHJcblx0XHRcdFx0XHRcdFx0XHRmdW5jdGlvbihwb3MpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0X3Bhbk9mZnNldFtheGlzXSA9IHBvcztcclxuXHRcdFx0XHRcdFx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHQpO1xyXG5cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdC8vIFJlZHVjZXMgdGhlIHNwZWVkIGJ5IHNsb3dEb3duUmF0aW8gKHBlciAxMG1zKVxyXG5cdFx0XHRjYWxjdWxhdGVBbmltT2Zmc2V0OiBmdW5jdGlvbihheGlzKSB7XHJcblx0XHRcdFx0aWYoIXMuYmFja0FuaW1TdGFydGVkW2F4aXNdKSB7XHJcblx0XHRcdFx0XHRzLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9bYXhpc10gPSBzLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9bYXhpc10gKiAocy5zbG93RG93blJhdGlvW2F4aXNdICsgXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gLSBcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cy5zbG93RG93blJhdGlvUmV2ZXJzZVtheGlzXSAqIHMudGltZURpZmYgLyAxMCk7XHJcblxyXG5cdFx0XHRcdFx0cy5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzW2F4aXNdID0gTWF0aC5hYnMocy5sYXN0RmxpY2tTcGVlZFtheGlzXSAqIHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSk7XHJcblx0XHRcdFx0XHRzLmRpc3RhbmNlT2Zmc2V0W2F4aXNdID0gcy5sYXN0RmxpY2tTcGVlZFtheGlzXSAqIHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSAqIHMudGltZURpZmY7XHJcblx0XHRcdFx0XHRfcGFuT2Zmc2V0W2F4aXNdICs9IHMuZGlzdGFuY2VPZmZzZXRbYXhpc107XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBhbkFuaW1Mb29wOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoIF9hbmltYXRpb25zLnpvb21QYW4gKSB7XHJcblx0XHRcdFx0XHRfYW5pbWF0aW9ucy56b29tUGFuLnJhZiA9IF9yZXF1ZXN0QUYocy5wYW5BbmltTG9vcCk7XHJcblxyXG5cdFx0XHRcdFx0cy5ub3cgPSBfZ2V0Q3VycmVudFRpbWUoKTtcclxuXHRcdFx0XHRcdHMudGltZURpZmYgPSBzLm5vdyAtIHMubGFzdE5vdztcclxuXHRcdFx0XHRcdHMubGFzdE5vdyA9IHMubm93O1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRzLmNhbGN1bGF0ZUFuaW1PZmZzZXQoJ3gnKTtcclxuXHRcdFx0XHRcdHMuY2FsY3VsYXRlQW5pbU9mZnNldCgneScpO1xyXG5cclxuXHRcdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdHMuY2FsY3VsYXRlT3ZlckJvdW5kc0FuaW1PZmZzZXQoJ3gnKTtcclxuXHRcdFx0XHRcdHMuY2FsY3VsYXRlT3ZlckJvdW5kc0FuaW1PZmZzZXQoJ3knKTtcclxuXHJcblxyXG5cdFx0XHRcdFx0aWYgKHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb0Ficy54IDwgMC4wNSAmJiBzLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9BYnMueSA8IDAuMDUpIHtcclxuXHJcblx0XHRcdFx0XHRcdC8vIHJvdW5kIHBhbiBwb3NpdGlvblxyXG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggPSBNYXRoLnJvdW5kKF9wYW5PZmZzZXQueCk7XHJcblx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueSA9IE1hdGgucm91bmQoX3Bhbk9mZnNldC55KTtcclxuXHRcdFx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdF9zdG9wQW5pbWF0aW9uKCd6b29tUGFuJyk7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHM7XHJcblx0fSxcclxuXHJcblx0X2NvbXBsZXRlUGFuR2VzdHVyZSA9IGZ1bmN0aW9uKGFuaW1EYXRhKSB7XHJcblx0XHQvLyBjYWxjdWxhdGUgc3dpcGUgc3BlZWQgZm9yIFkgYXhpcyAocGFhbm5pbmcpXHJcblx0XHRhbmltRGF0YS5jYWxjdWxhdGVTd2lwZVNwZWVkKCd5Jyk7XHJcblxyXG5cdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcclxuXHRcdFxyXG5cdFx0YW5pbURhdGEuYmFja0FuaW1EZXN0aW5hdGlvbiA9IHt9O1xyXG5cdFx0YW5pbURhdGEuYmFja0FuaW1TdGFydGVkID0ge307XHJcblxyXG5cdFx0Ly8gQXZvaWQgYWNjZWxlcmF0aW9uIGFuaW1hdGlvbiBpZiBzcGVlZCBpcyB0b28gbG93XHJcblx0XHRpZihNYXRoLmFicyhhbmltRGF0YS5sYXN0RmxpY2tTcGVlZC54KSA8PSAwLjA1ICYmIE1hdGguYWJzKGFuaW1EYXRhLmxhc3RGbGlja1NwZWVkLnkpIDw9IDAuMDUgKSB7XHJcblx0XHRcdGFuaW1EYXRhLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9BYnMueCA9IGFuaW1EYXRhLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9BYnMueSA9IDA7XHJcblxyXG5cdFx0XHQvLyBSdW4gcGFuIGRyYWcgcmVsZWFzZSBhbmltYXRpb24uIEUuZy4gaWYgeW91IGRyYWcgaW1hZ2UgYW5kIHJlbGVhc2UgZmluZ2VyIHdpdGhvdXQgbW9tZW50dW0uXHJcblx0XHRcdGFuaW1EYXRhLmNhbGN1bGF0ZU92ZXJCb3VuZHNBbmltT2Zmc2V0KCd4Jyk7XHJcblx0XHRcdGFuaW1EYXRhLmNhbGN1bGF0ZU92ZXJCb3VuZHNBbmltT2Zmc2V0KCd5Jyk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEFuaW1hdGlvbiBsb29wIHRoYXQgY29udHJvbHMgdGhlIGFjY2VsZXJhdGlvbiBhZnRlciBwYW4gZ2VzdHVyZSBlbmRzXHJcblx0XHRfcmVnaXN0ZXJTdGFydEFuaW1hdGlvbignem9vbVBhbicpO1xyXG5cdFx0YW5pbURhdGEubGFzdE5vdyA9IF9nZXRDdXJyZW50VGltZSgpO1xyXG5cdFx0YW5pbURhdGEucGFuQW5pbUxvb3AoKTtcclxuXHR9LFxyXG5cclxuXHJcblx0X2ZpbmlzaFN3aXBlTWFpblNjcm9sbEdlc3R1cmUgPSBmdW5jdGlvbihnZXN0dXJlVHlwZSwgX3JlbGVhc2VBbmltRGF0YSkge1xyXG5cdFx0dmFyIGl0ZW1DaGFuZ2VkO1xyXG5cdFx0aWYoIV9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XHJcblx0XHRcdF9jdXJyWm9vbWVkSXRlbUluZGV4ID0gX2N1cnJlbnRJdGVtSW5kZXg7XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdFxyXG5cdFx0dmFyIGl0ZW1zRGlmZjtcclxuXHJcblx0XHRpZihnZXN0dXJlVHlwZSA9PT0gJ3N3aXBlJykge1xyXG5cdFx0XHR2YXIgdG90YWxTaGlmdERpc3QgPSBfY3VyclBvaW50LnggLSBfc3RhcnRQb2ludC54LFxyXG5cdFx0XHRcdGlzRmFzdExhc3RGbGljayA9IF9yZWxlYXNlQW5pbURhdGEubGFzdEZsaWNrRGlzdC54IDwgMTA7XHJcblxyXG5cdFx0XHQvLyBpZiBjb250YWluZXIgaXMgc2hpZnRlZCBmb3IgbW9yZSB0aGFuIE1JTl9TV0lQRV9ESVNUQU5DRSwgXHJcblx0XHRcdC8vIGFuZCBsYXN0IGZsaWNrIGdlc3R1cmUgd2FzIGluIHJpZ2h0IGRpcmVjdGlvblxyXG5cdFx0XHRpZih0b3RhbFNoaWZ0RGlzdCA+IE1JTl9TV0lQRV9ESVNUQU5DRSAmJiBcclxuXHRcdFx0XHQoaXNGYXN0TGFzdEZsaWNrIHx8IF9yZWxlYXNlQW5pbURhdGEubGFzdEZsaWNrT2Zmc2V0LnggPiAyMCkgKSB7XHJcblx0XHRcdFx0Ly8gZ28gdG8gcHJldiBpdGVtXHJcblx0XHRcdFx0aXRlbXNEaWZmID0gLTE7XHJcblx0XHRcdH0gZWxzZSBpZih0b3RhbFNoaWZ0RGlzdCA8IC1NSU5fU1dJUEVfRElTVEFOQ0UgJiYgXHJcblx0XHRcdFx0KGlzRmFzdExhc3RGbGljayB8fCBfcmVsZWFzZUFuaW1EYXRhLmxhc3RGbGlja09mZnNldC54IDwgLTIwKSApIHtcclxuXHRcdFx0XHQvLyBnbyB0byBuZXh0IGl0ZW1cclxuXHRcdFx0XHRpdGVtc0RpZmYgPSAxO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG5leHRDaXJjbGU7XHJcblxyXG5cdFx0aWYoaXRlbXNEaWZmKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRfY3VycmVudEl0ZW1JbmRleCArPSBpdGVtc0RpZmY7XHJcblxyXG5cdFx0XHRpZihfY3VycmVudEl0ZW1JbmRleCA8IDApIHtcclxuXHRcdFx0XHRfY3VycmVudEl0ZW1JbmRleCA9IF9vcHRpb25zLmxvb3AgPyBfZ2V0TnVtSXRlbXMoKS0xIDogMDtcclxuXHRcdFx0XHRuZXh0Q2lyY2xlID0gdHJ1ZTtcclxuXHRcdFx0fSBlbHNlIGlmKF9jdXJyZW50SXRlbUluZGV4ID49IF9nZXROdW1JdGVtcygpKSB7XHJcblx0XHRcdFx0X2N1cnJlbnRJdGVtSW5kZXggPSBfb3B0aW9ucy5sb29wID8gMCA6IF9nZXROdW1JdGVtcygpLTE7XHJcblx0XHRcdFx0bmV4dENpcmNsZSA9IHRydWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKCFuZXh0Q2lyY2xlIHx8IF9vcHRpb25zLmxvb3ApIHtcclxuXHRcdFx0XHRfaW5kZXhEaWZmICs9IGl0ZW1zRGlmZjtcclxuXHRcdFx0XHRfY3VyclBvc2l0aW9uSW5kZXggLT0gaXRlbXNEaWZmO1xyXG5cdFx0XHRcdGl0ZW1DaGFuZ2VkID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBhbmltYXRlVG9YID0gX3NsaWRlU2l6ZS54ICogX2N1cnJQb3NpdGlvbkluZGV4O1xyXG5cdFx0dmFyIGFuaW1hdGVUb0Rpc3QgPSBNYXRoLmFicyggYW5pbWF0ZVRvWCAtIF9tYWluU2Nyb2xsUG9zLnggKTtcclxuXHRcdHZhciBmaW5pc2hBbmltRHVyYXRpb247XHJcblxyXG5cclxuXHRcdGlmKCFpdGVtQ2hhbmdlZCAmJiBhbmltYXRlVG9YID4gX21haW5TY3JvbGxQb3MueCAhPT0gX3JlbGVhc2VBbmltRGF0YS5sYXN0RmxpY2tTcGVlZC54ID4gMCkge1xyXG5cdFx0XHQvLyBcInJldHVybiB0byBjdXJyZW50XCIgZHVyYXRpb24sIGUuZy4gd2hlbiBkcmFnZ2luZyBmcm9tIHNsaWRlIDAgdG8gLTFcclxuXHRcdFx0ZmluaXNoQW5pbUR1cmF0aW9uID0gMzMzOyBcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGZpbmlzaEFuaW1EdXJhdGlvbiA9IE1hdGguYWJzKF9yZWxlYXNlQW5pbURhdGEubGFzdEZsaWNrU3BlZWQueCkgPiAwID8gXHJcblx0XHRcdFx0XHRcdFx0XHRcdGFuaW1hdGVUb0Rpc3QgLyBNYXRoLmFicyhfcmVsZWFzZUFuaW1EYXRhLmxhc3RGbGlja1NwZWVkLngpIDogXHJcblx0XHRcdFx0XHRcdFx0XHRcdDMzMztcclxuXHJcblx0XHRcdGZpbmlzaEFuaW1EdXJhdGlvbiA9IE1hdGgubWluKGZpbmlzaEFuaW1EdXJhdGlvbiwgNDAwKTtcclxuXHRcdFx0ZmluaXNoQW5pbUR1cmF0aW9uID0gTWF0aC5tYXgoZmluaXNoQW5pbUR1cmF0aW9uLCAyNTApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKF9jdXJyWm9vbWVkSXRlbUluZGV4ID09PSBfY3VycmVudEl0ZW1JbmRleCkge1xyXG5cdFx0XHRpdGVtQ2hhbmdlZCA9IGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRfbWFpblNjcm9sbEFuaW1hdGluZyA9IHRydWU7XHJcblx0XHRcclxuXHRcdF9zaG91dCgnbWFpblNjcm9sbEFuaW1TdGFydCcpO1xyXG5cclxuXHRcdF9hbmltYXRlUHJvcCgnbWFpblNjcm9sbCcsIF9tYWluU2Nyb2xsUG9zLngsIGFuaW1hdGVUb1gsIGZpbmlzaEFuaW1EdXJhdGlvbiwgZnJhbWV3b3JrLmVhc2luZy5jdWJpYy5vdXQsIFxyXG5cdFx0XHRfbW92ZU1haW5TY3JvbGwsXHJcblx0XHRcdGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdF9zdG9wQWxsQW5pbWF0aW9ucygpO1xyXG5cdFx0XHRcdF9tYWluU2Nyb2xsQW5pbWF0aW5nID0gZmFsc2U7XHJcblx0XHRcdFx0X2N1cnJab29tZWRJdGVtSW5kZXggPSAtMTtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZihpdGVtQ2hhbmdlZCB8fCBfY3Vyclpvb21lZEl0ZW1JbmRleCAhPT0gX2N1cnJlbnRJdGVtSW5kZXgpIHtcclxuXHRcdFx0XHRcdHNlbGYudXBkYXRlQ3Vyckl0ZW0oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0X3Nob3V0KCdtYWluU2Nyb2xsQW5pbUNvbXBsZXRlJyk7XHJcblx0XHRcdH1cclxuXHRcdCk7XHJcblxyXG5cdFx0aWYoaXRlbUNoYW5nZWQpIHtcclxuXHRcdFx0c2VsZi51cGRhdGVDdXJySXRlbSh0cnVlKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gaXRlbUNoYW5nZWQ7XHJcblx0fSxcclxuXHJcblx0X2NhbGN1bGF0ZVpvb21MZXZlbCA9IGZ1bmN0aW9uKHRvdWNoZXNEaXN0YW5jZSkge1xyXG5cdFx0cmV0dXJuICAxIC8gX3N0YXJ0UG9pbnRzRGlzdGFuY2UgKiB0b3VjaGVzRGlzdGFuY2UgKiBfc3RhcnRab29tTGV2ZWw7XHJcblx0fSxcclxuXHJcblx0Ly8gUmVzZXRzIHpvb20gaWYgaXQncyBvdXQgb2YgYm91bmRzXHJcblx0X2NvbXBsZXRlWm9vbUdlc3R1cmUgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZXN0Wm9vbUxldmVsID0gX2N1cnJab29tTGV2ZWwsXHJcblx0XHRcdG1pblpvb21MZXZlbCA9IF9nZXRNaW5ab29tTGV2ZWwoKSxcclxuXHRcdFx0bWF4Wm9vbUxldmVsID0gX2dldE1heFpvb21MZXZlbCgpO1xyXG5cclxuXHRcdGlmICggX2N1cnJab29tTGV2ZWwgPCBtaW5ab29tTGV2ZWwgKSB7XHJcblx0XHRcdGRlc3Rab29tTGV2ZWwgPSBtaW5ab29tTGV2ZWw7XHJcblx0XHR9IGVsc2UgaWYgKCBfY3Vyclpvb21MZXZlbCA+IG1heFpvb21MZXZlbCApIHtcclxuXHRcdFx0ZGVzdFpvb21MZXZlbCA9IG1heFpvb21MZXZlbDtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZGVzdE9wYWNpdHkgPSAxLFxyXG5cdFx0XHRvblVwZGF0ZSxcclxuXHRcdFx0aW5pdGlhbE9wYWNpdHkgPSBfYmdPcGFjaXR5O1xyXG5cclxuXHRcdGlmKF9vcGFjaXR5Q2hhbmdlZCAmJiAhX2lzWm9vbWluZ0luICYmICFfd2FzT3ZlckluaXRpYWxab29tICYmIF9jdXJyWm9vbUxldmVsIDwgbWluWm9vbUxldmVsKSB7XHJcblx0XHRcdC8vX2Nsb3NlZEJ5U2Nyb2xsID0gdHJ1ZTtcclxuXHRcdFx0c2VsZi5jbG9zZSgpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZihfb3BhY2l0eUNoYW5nZWQpIHtcclxuXHRcdFx0b25VcGRhdGUgPSBmdW5jdGlvbihub3cpIHtcclxuXHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoICAoZGVzdE9wYWNpdHkgLSBpbml0aWFsT3BhY2l0eSkgKiBub3cgKyBpbml0aWFsT3BhY2l0eSApO1xyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cclxuXHRcdHNlbGYuem9vbVRvKGRlc3Rab29tTGV2ZWwsIDAsIDIwMCwgIGZyYW1ld29yay5lYXNpbmcuY3ViaWMub3V0LCBvblVwZGF0ZSk7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9O1xyXG5cclxuXHJcbl9yZWdpc3Rlck1vZHVsZSgnR2VzdHVyZXMnLCB7XHJcblx0cHVibGljTWV0aG9kczoge1xyXG5cclxuXHRcdGluaXRHZXN0dXJlczogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHQvLyBoZWxwZXIgZnVuY3Rpb24gdGhhdCBidWlsZHMgdG91Y2gvcG9pbnRlci9tb3VzZSBldmVudHNcclxuXHRcdFx0dmFyIGFkZEV2ZW50TmFtZXMgPSBmdW5jdGlvbihwcmVmLCBkb3duLCBtb3ZlLCB1cCwgY2FuY2VsKSB7XHJcblx0XHRcdFx0X2RyYWdTdGFydEV2ZW50ID0gcHJlZiArIGRvd247XHJcblx0XHRcdFx0X2RyYWdNb3ZlRXZlbnQgPSBwcmVmICsgbW92ZTtcclxuXHRcdFx0XHRfZHJhZ0VuZEV2ZW50ID0gcHJlZiArIHVwO1xyXG5cdFx0XHRcdGlmKGNhbmNlbCkge1xyXG5cdFx0XHRcdFx0X2RyYWdDYW5jZWxFdmVudCA9IHByZWYgKyBjYW5jZWw7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdF9kcmFnQ2FuY2VsRXZlbnQgPSAnJztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRfcG9pbnRlckV2ZW50RW5hYmxlZCA9IF9mZWF0dXJlcy5wb2ludGVyRXZlbnQ7XHJcblx0XHRcdGlmKF9wb2ludGVyRXZlbnRFbmFibGVkICYmIF9mZWF0dXJlcy50b3VjaCkge1xyXG5cdFx0XHRcdC8vIHdlIGRvbid0IG5lZWQgdG91Y2ggZXZlbnRzLCBpZiBicm93c2VyIHN1cHBvcnRzIHBvaW50ZXIgZXZlbnRzXHJcblx0XHRcdFx0X2ZlYXR1cmVzLnRvdWNoID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKF9wb2ludGVyRXZlbnRFbmFibGVkKSB7XHJcblx0XHRcdFx0aWYobmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XHJcblx0XHRcdFx0XHRhZGRFdmVudE5hbWVzKCdwb2ludGVyJywgJ2Rvd24nLCAnbW92ZScsICd1cCcsICdjYW5jZWwnKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Ly8gSUUxMCBwb2ludGVyIGV2ZW50cyBhcmUgY2FzZS1zZW5zaXRpdmVcclxuXHRcdFx0XHRcdGFkZEV2ZW50TmFtZXMoJ01TUG9pbnRlcicsICdEb3duJywgJ01vdmUnLCAnVXAnLCAnQ2FuY2VsJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2UgaWYoX2ZlYXR1cmVzLnRvdWNoKSB7XHJcblx0XHRcdFx0YWRkRXZlbnROYW1lcygndG91Y2gnLCAnc3RhcnQnLCAnbW92ZScsICdlbmQnLCAnY2FuY2VsJyk7XHJcblx0XHRcdFx0X2xpa2VseVRvdWNoRGV2aWNlID0gdHJ1ZTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRhZGRFdmVudE5hbWVzKCdtb3VzZScsICdkb3duJywgJ21vdmUnLCAndXAnKTtcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRfdXBNb3ZlRXZlbnRzID0gX2RyYWdNb3ZlRXZlbnQgKyAnICcgKyBfZHJhZ0VuZEV2ZW50ICArICcgJyArICBfZHJhZ0NhbmNlbEV2ZW50O1xyXG5cdFx0XHRfZG93bkV2ZW50cyA9IF9kcmFnU3RhcnRFdmVudDtcclxuXHJcblx0XHRcdGlmKF9wb2ludGVyRXZlbnRFbmFibGVkICYmICFfbGlrZWx5VG91Y2hEZXZpY2UpIHtcclxuXHRcdFx0XHRfbGlrZWx5VG91Y2hEZXZpY2UgPSAobmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMSkgfHwgKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzID4gMSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gbWFrZSB2YXJpYWJsZSBwdWJsaWNcclxuXHRcdFx0c2VsZi5saWtlbHlUb3VjaERldmljZSA9IF9saWtlbHlUb3VjaERldmljZTsgXHJcblx0XHRcdFxyXG5cdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tfZHJhZ1N0YXJ0RXZlbnRdID0gX29uRHJhZ1N0YXJ0O1xyXG5cdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tfZHJhZ01vdmVFdmVudF0gPSBfb25EcmFnTW92ZTtcclxuXHRcdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdFbmRFdmVudF0gPSBfb25EcmFnUmVsZWFzZTsgLy8gdGhlIEtyYWtlblxyXG5cclxuXHRcdFx0aWYoX2RyYWdDYW5jZWxFdmVudCkge1xyXG5cdFx0XHRcdF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnQ2FuY2VsRXZlbnRdID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdFbmRFdmVudF07XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIEJpbmQgbW91c2UgZXZlbnRzIG9uIGRldmljZSB3aXRoIGRldGVjdGVkIGhhcmR3YXJlIHRvdWNoIHN1cHBvcnQsIGluIGNhc2UgaXQgc3VwcG9ydHMgbXVsdGlwbGUgdHlwZXMgb2YgaW5wdXQuXHJcblx0XHRcdGlmKF9mZWF0dXJlcy50b3VjaCkge1xyXG5cdFx0XHRcdF9kb3duRXZlbnRzICs9ICcgbW91c2Vkb3duJztcclxuXHRcdFx0XHRfdXBNb3ZlRXZlbnRzICs9ICcgbW91c2Vtb3ZlIG1vdXNldXAnO1xyXG5cdFx0XHRcdF9nbG9iYWxFdmVudEhhbmRsZXJzLm1vdXNlZG93biA9IF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnU3RhcnRFdmVudF07XHJcblx0XHRcdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMubW91c2Vtb3ZlID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdNb3ZlRXZlbnRdO1xyXG5cdFx0XHRcdF9nbG9iYWxFdmVudEhhbmRsZXJzLm1vdXNldXAgPSBfZ2xvYmFsRXZlbnRIYW5kbGVyc1tfZHJhZ0VuZEV2ZW50XTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIV9saWtlbHlUb3VjaERldmljZSkge1xyXG5cdFx0XHRcdC8vIGRvbid0IGFsbG93IHBhbiB0byBuZXh0IHNsaWRlIGZyb20gem9vbWVkIHN0YXRlIG9uIERlc2t0b3BcclxuXHRcdFx0XHRfb3B0aW9ucy5hbGxvd1BhblRvTmV4dCA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuLyo+Pmdlc3R1cmVzKi9cclxuXHJcbi8qPj5zaG93LWhpZGUtdHJhbnNpdGlvbiovXHJcbi8qKlxyXG4gKiBzaG93LWhpZGUtdHJhbnNpdGlvbi5qczpcclxuICpcclxuICogTWFuYWdlcyBpbml0aWFsIG9wZW5pbmcgb3IgY2xvc2luZyB0cmFuc2l0aW9uLlxyXG4gKlxyXG4gKiBJZiB5b3UncmUgbm90IHBsYW5uaW5nIHRvIHVzZSB0cmFuc2l0aW9uIGZvciBnYWxsZXJ5IGF0IGFsbCxcclxuICogeW91IG1heSBzZXQgb3B0aW9ucyBoaWRlQW5pbWF0aW9uRHVyYXRpb24gYW5kIHNob3dBbmltYXRpb25EdXJhdGlvbiB0byAwLFxyXG4gKiBhbmQganVzdCBkZWxldGUgc3RhcnRBbmltYXRpb24gZnVuY3Rpb24uXHJcbiAqIFxyXG4gKi9cclxuXHJcblxyXG52YXIgX3Nob3dPckhpZGVUaW1lb3V0LFxyXG5cdF9zaG93T3JIaWRlID0gZnVuY3Rpb24oaXRlbSwgaW1nLCBvdXQsIGNvbXBsZXRlRm4pIHtcclxuXHJcblx0XHRpZihfc2hvd09ySGlkZVRpbWVvdXQpIHtcclxuXHRcdFx0Y2xlYXJUaW1lb3V0KF9zaG93T3JIaWRlVGltZW91dCk7XHJcblx0XHR9XHJcblxyXG5cdFx0X2luaXRpYWxab29tUnVubmluZyA9IHRydWU7XHJcblx0XHRfaW5pdGlhbENvbnRlbnRTZXQgPSB0cnVlO1xyXG5cdFx0XHJcblx0XHQvLyBkaW1lbnNpb25zIG9mIHNtYWxsIHRodW1ibmFpbCB7eDoseTosdzp9LlxyXG5cdFx0Ly8gSGVpZ2h0IGlzIG9wdGlvbmFsLCBhcyBjYWxjdWxhdGVkIGJhc2VkIG9uIGxhcmdlIGltYWdlLlxyXG5cdFx0dmFyIHRodW1iQm91bmRzOyBcclxuXHRcdGlmKGl0ZW0uaW5pdGlhbExheW91dCkge1xyXG5cdFx0XHR0aHVtYkJvdW5kcyA9IGl0ZW0uaW5pdGlhbExheW91dDtcclxuXHRcdFx0aXRlbS5pbml0aWFsTGF5b3V0ID0gbnVsbDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRodW1iQm91bmRzID0gX29wdGlvbnMuZ2V0VGh1bWJCb3VuZHNGbiAmJiBfb3B0aW9ucy5nZXRUaHVtYkJvdW5kc0ZuKF9jdXJyZW50SXRlbUluZGV4KTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZHVyYXRpb24gPSBvdXQgPyBfb3B0aW9ucy5oaWRlQW5pbWF0aW9uRHVyYXRpb24gOiBfb3B0aW9ucy5zaG93QW5pbWF0aW9uRHVyYXRpb247XHJcblxyXG5cdFx0dmFyIG9uQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0X3N0b3BBbmltYXRpb24oJ2luaXRpYWxab29tJyk7XHJcblx0XHRcdGlmKCFvdXQpIHtcclxuXHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoMSk7XHJcblx0XHRcdFx0aWYoaW1nKSB7XHJcblx0XHRcdFx0XHRpbWcuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWFuaW1hdGVkLWluJyk7XHJcblx0XHRcdFx0X3Nob3V0KCdpbml0aWFsWm9vbScgKyAob3V0ID8gJ091dEVuZCcgOiAnSW5FbmQnKSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0c2VsZi50ZW1wbGF0ZS5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XHJcblx0XHRcdFx0c2VsZi5iZy5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKGNvbXBsZXRlRm4pIHtcclxuXHRcdFx0XHRjb21wbGV0ZUZuKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0X2luaXRpYWxab29tUnVubmluZyA9IGZhbHNlO1xyXG5cdFx0fTtcclxuXHJcblx0XHQvLyBpZiBib3VuZHMgYXJlbid0IHByb3ZpZGVkLCBqdXN0IG9wZW4gZ2FsbGVyeSB3aXRob3V0IGFuaW1hdGlvblxyXG5cdFx0aWYoIWR1cmF0aW9uIHx8ICF0aHVtYkJvdW5kcyB8fCB0aHVtYkJvdW5kcy54ID09PSB1bmRlZmluZWQpIHtcclxuXHJcblx0XHRcdF9zaG91dCgnaW5pdGlhbFpvb20nICsgKG91dCA/ICdPdXQnIDogJ0luJykgKTtcclxuXHJcblx0XHRcdF9jdXJyWm9vbUxldmVsID0gaXRlbS5pbml0aWFsWm9vbUxldmVsO1xyXG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX3Bhbk9mZnNldCwgIGl0ZW0uaW5pdGlhbFBvc2l0aW9uICk7XHJcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XHJcblxyXG5cdFx0XHR0ZW1wbGF0ZS5zdHlsZS5vcGFjaXR5ID0gb3V0ID8gMCA6IDE7XHJcblx0XHRcdF9hcHBseUJnT3BhY2l0eSgxKTtcclxuXHJcblx0XHRcdGlmKGR1cmF0aW9uKSB7XHJcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdG9uQ29tcGxldGUoKTtcclxuXHRcdFx0XHR9LCBkdXJhdGlvbik7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0b25Db21wbGV0ZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHN0YXJ0QW5pbWF0aW9uID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBjbG9zZVdpdGhSYWYgPSBfY2xvc2VkQnlTY3JvbGwsXHJcblx0XHRcdFx0ZmFkZUV2ZXJ5dGhpbmcgPSAhc2VsZi5jdXJySXRlbS5zcmMgfHwgc2VsZi5jdXJySXRlbS5sb2FkRXJyb3IgfHwgX29wdGlvbnMuc2hvd0hpZGVPcGFjaXR5O1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gYXBwbHkgaHctYWNjZWxlcmF0aW9uIHRvIGltYWdlXHJcblx0XHRcdGlmKGl0ZW0ubWluaUltZykge1xyXG5cdFx0XHRcdGl0ZW0ubWluaUltZy5zdHlsZS53ZWJraXRCYWNrZmFjZVZpc2liaWxpdHkgPSAnaGlkZGVuJztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIW91dCkge1xyXG5cdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gdGh1bWJCb3VuZHMudyAvIGl0ZW0udztcclxuXHRcdFx0XHRfcGFuT2Zmc2V0LnggPSB0aHVtYkJvdW5kcy54O1xyXG5cdFx0XHRcdF9wYW5PZmZzZXQueSA9IHRodW1iQm91bmRzLnkgLSBfaW5pdGFsV2luZG93U2Nyb2xsWTtcclxuXHJcblx0XHRcdFx0c2VsZltmYWRlRXZlcnl0aGluZyA/ICd0ZW1wbGF0ZScgOiAnYmcnXS5zdHlsZS5vcGFjaXR5ID0gMC4wMDE7XHJcblx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0X3JlZ2lzdGVyU3RhcnRBbmltYXRpb24oJ2luaXRpYWxab29tJyk7XHJcblx0XHRcdFxyXG5cdFx0XHRpZihvdXQgJiYgIWNsb3NlV2l0aFJhZikge1xyXG5cdFx0XHRcdGZyYW1ld29yay5yZW1vdmVDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWFuaW1hdGVkLWluJyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKGZhZGVFdmVyeXRoaW5nKSB7XHJcblx0XHRcdFx0aWYob3V0KSB7XHJcblx0XHRcdFx0XHRmcmFtZXdvcmtbIChjbG9zZVdpdGhSYWYgPyAncmVtb3ZlJyA6ICdhZGQnKSArICdDbGFzcycgXSh0ZW1wbGF0ZSwgJ3Bzd3AtLWFuaW1hdGVfb3BhY2l0eScpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS1hbmltYXRlX29wYWNpdHknKTtcclxuXHRcdFx0XHRcdH0sIDMwKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdF9zaG93T3JIaWRlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdF9zaG91dCgnaW5pdGlhbFpvb20nICsgKG91dCA/ICdPdXQnIDogJ0luJykgKTtcclxuXHRcdFx0XHRcclxuXHJcblx0XHRcdFx0aWYoIW91dCkge1xyXG5cclxuXHRcdFx0XHRcdC8vIFwiaW5cIiBhbmltYXRpb24gYWx3YXlzIHVzZXMgQ1NTIHRyYW5zaXRpb25zIChpbnN0ZWFkIG9mIHJBRikuXHJcblx0XHRcdFx0XHQvLyBDU1MgdHJhbnNpdGlvbiB3b3JrIGZhc3RlciBoZXJlLCBcclxuXHRcdFx0XHRcdC8vIGFzIGRldmVsb3BlciBtYXkgYWxzbyB3YW50IHRvIGFuaW1hdGUgb3RoZXIgdGhpbmdzLCBcclxuXHRcdFx0XHRcdC8vIGxpa2UgdWkgb24gdG9wIG9mIHNsaWRpbmcgYXJlYSwgd2hpY2ggY2FuIGJlIGFuaW1hdGVkIGp1c3QgdmlhIENTU1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRfY3Vyclpvb21MZXZlbCA9IGl0ZW0uaW5pdGlhbFpvb21MZXZlbDtcclxuXHRcdFx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfcGFuT2Zmc2V0LCAgaXRlbS5pbml0aWFsUG9zaXRpb24gKTtcclxuXHRcdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XHJcblx0XHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoMSk7XHJcblxyXG5cdFx0XHRcdFx0aWYoZmFkZUV2ZXJ5dGhpbmcpIHtcclxuXHRcdFx0XHRcdFx0dGVtcGxhdGUuc3R5bGUub3BhY2l0eSA9IDE7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoMSk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0X3Nob3dPckhpZGVUaW1lb3V0ID0gc2V0VGltZW91dChvbkNvbXBsZXRlLCBkdXJhdGlvbiArIDIwKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdC8vIFwib3V0XCIgYW5pbWF0aW9uIHVzZXMgckFGIG9ubHkgd2hlbiBQaG90b1N3aXBlIGlzIGNsb3NlZCBieSBicm93c2VyIHNjcm9sbCwgdG8gcmVjYWxjdWxhdGUgcG9zaXRpb25cclxuXHRcdFx0XHRcdHZhciBkZXN0Wm9vbUxldmVsID0gdGh1bWJCb3VuZHMudyAvIGl0ZW0udyxcclxuXHRcdFx0XHRcdFx0aW5pdGlhbFBhbk9mZnNldCA9IHtcclxuXHRcdFx0XHRcdFx0XHR4OiBfcGFuT2Zmc2V0LngsXHJcblx0XHRcdFx0XHRcdFx0eTogX3Bhbk9mZnNldC55XHJcblx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdGluaXRpYWxab29tTGV2ZWwgPSBfY3Vyclpvb21MZXZlbCxcclxuXHRcdFx0XHRcdFx0aW5pdGFsQmdPcGFjaXR5ID0gX2JnT3BhY2l0eSxcclxuXHRcdFx0XHRcdFx0b25VcGRhdGUgPSBmdW5jdGlvbihub3cpIHtcclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRpZihub3cgPT09IDEpIHtcclxuXHRcdFx0XHRcdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gZGVzdFpvb21MZXZlbDtcclxuXHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueCA9IHRodW1iQm91bmRzLng7XHJcblx0XHRcdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSB0aHVtYkJvdW5kcy55ICAtIF9jdXJyZW50V2luZG93U2Nyb2xsWTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0X2N1cnJab29tTGV2ZWwgPSAoZGVzdFpvb21MZXZlbCAtIGluaXRpYWxab29tTGV2ZWwpICogbm93ICsgaW5pdGlhbFpvb21MZXZlbDtcclxuXHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueCA9ICh0aHVtYkJvdW5kcy54IC0gaW5pdGlhbFBhbk9mZnNldC54KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueDtcclxuXHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueSA9ICh0aHVtYkJvdW5kcy55IC0gX2N1cnJlbnRXaW5kb3dTY3JvbGxZIC0gaW5pdGlhbFBhbk9mZnNldC55KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcclxuXHRcdFx0XHRcdFx0XHRpZihmYWRlRXZlcnl0aGluZykge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGVtcGxhdGUuc3R5bGUub3BhY2l0eSA9IDEgLSBub3c7XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdF9hcHBseUJnT3BhY2l0eSggaW5pdGFsQmdPcGFjaXR5IC0gbm93ICogaW5pdGFsQmdPcGFjaXR5ICk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHRcdGlmKGNsb3NlV2l0aFJhZikge1xyXG5cdFx0XHRcdFx0XHRfYW5pbWF0ZVByb3AoJ2luaXRpYWxab29tJywgMCwgMSwgZHVyYXRpb24sIGZyYW1ld29yay5lYXNpbmcuY3ViaWMub3V0LCBvblVwZGF0ZSwgb25Db21wbGV0ZSk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRvblVwZGF0ZSgxKTtcclxuXHRcdFx0XHRcdFx0X3Nob3dPckhpZGVUaW1lb3V0ID0gc2V0VGltZW91dChvbkNvbXBsZXRlLCBkdXJhdGlvbiArIDIwKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR9LCBvdXQgPyAyNSA6IDkwKTsgLy8gTWFpbiBwdXJwb3NlIG9mIHRoaXMgZGVsYXkgaXMgdG8gZ2l2ZSBicm93c2VyIHRpbWUgdG8gcGFpbnQgYW5kXHJcblx0XHRcdFx0XHQvLyBjcmVhdGUgY29tcG9zaXRlIGxheWVycyBvZiBQaG90b1N3aXBlIFVJIHBhcnRzIChiYWNrZ3JvdW5kLCBjb250cm9scywgY2FwdGlvbiwgYXJyb3dzKS5cclxuXHRcdFx0XHRcdC8vIFdoaWNoIGF2b2lkcyBsYWcgYXQgdGhlIGJlZ2lubmluZyBvZiBzY2FsZSB0cmFuc2l0aW9uLlxyXG5cdFx0fTtcclxuXHRcdHN0YXJ0QW5pbWF0aW9uKCk7XHJcblxyXG5cdFx0XHJcblx0fTtcclxuXHJcbi8qPj5zaG93LWhpZGUtdHJhbnNpdGlvbiovXHJcblxyXG4vKj4+aXRlbXMtY29udHJvbGxlciovXHJcbi8qKlxyXG4qXHJcbiogQ29udHJvbGxlciBtYW5hZ2VzIGdhbGxlcnkgaXRlbXMsIHRoZWlyIGRpbWVuc2lvbnMsIGFuZCB0aGVpciBjb250ZW50LlxyXG4qIFxyXG4qL1xyXG5cclxudmFyIF9pdGVtcyxcclxuXHRfdGVtcFBhbkFyZWFTaXplID0ge30sXHJcblx0X2ltYWdlc1RvQXBwZW5kUG9vbCA9IFtdLFxyXG5cdF9pbml0aWFsQ29udGVudFNldCxcclxuXHRfaW5pdGlhbFpvb21SdW5uaW5nLFxyXG5cdF9jb250cm9sbGVyRGVmYXVsdE9wdGlvbnMgPSB7XHJcblx0XHRpbmRleDogMCxcclxuXHRcdGVycm9yTXNnOiAnPGRpdiBjbGFzcz1cInBzd3BfX2Vycm9yLW1zZ1wiPjxhIGhyZWY9XCIldXJsJVwiIHRhcmdldD1cIl9ibGFua1wiPlRoZSBpbWFnZTwvYT4gY291bGQgbm90IGJlIGxvYWRlZC48L2Rpdj4nLFxyXG5cdFx0Zm9yY2VQcm9ncmVzc2l2ZUxvYWRpbmc6IGZhbHNlLCAvLyBUT0RPXHJcblx0XHRwcmVsb2FkOiBbMSwxXSxcclxuXHRcdGdldE51bUl0ZW1zRm46IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gX2l0ZW1zLmxlbmd0aDtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHJcbnZhciBfZ2V0SXRlbUF0LFxyXG5cdF9nZXROdW1JdGVtcyxcclxuXHRfaW5pdGlhbElzTG9vcCxcclxuXHRfZ2V0WmVyb0JvdW5kcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Y2VudGVyOnt4OjAseTowfSwgXHJcblx0XHRcdG1heDp7eDowLHk6MH0sIFxyXG5cdFx0XHRtaW46e3g6MCx5OjB9XHJcblx0XHR9O1xyXG5cdH0sXHJcblx0X2NhbGN1bGF0ZVNpbmdsZUl0ZW1QYW5Cb3VuZHMgPSBmdW5jdGlvbihpdGVtLCByZWFsUGFuRWxlbWVudFcsIHJlYWxQYW5FbGVtZW50SCApIHtcclxuXHRcdHZhciBib3VuZHMgPSBpdGVtLmJvdW5kcztcclxuXHJcblx0XHQvLyBwb3NpdGlvbiBvZiBlbGVtZW50IHdoZW4gaXQncyBjZW50ZXJlZFxyXG5cdFx0Ym91bmRzLmNlbnRlci54ID0gTWF0aC5yb3VuZCgoX3RlbXBQYW5BcmVhU2l6ZS54IC0gcmVhbFBhbkVsZW1lbnRXKSAvIDIpO1xyXG5cdFx0Ym91bmRzLmNlbnRlci55ID0gTWF0aC5yb3VuZCgoX3RlbXBQYW5BcmVhU2l6ZS55IC0gcmVhbFBhbkVsZW1lbnRIKSAvIDIpICsgaXRlbS52R2FwLnRvcDtcclxuXHJcblx0XHQvLyBtYXhpbXVtIHBhbiBwb3NpdGlvblxyXG5cdFx0Ym91bmRzLm1heC54ID0gKHJlYWxQYW5FbGVtZW50VyA+IF90ZW1wUGFuQXJlYVNpemUueCkgPyBcclxuXHRcdFx0XHRcdFx0XHRNYXRoLnJvdW5kKF90ZW1wUGFuQXJlYVNpemUueCAtIHJlYWxQYW5FbGVtZW50VykgOiBcclxuXHRcdFx0XHRcdFx0XHRib3VuZHMuY2VudGVyLng7XHJcblx0XHRcclxuXHRcdGJvdW5kcy5tYXgueSA9IChyZWFsUGFuRWxlbWVudEggPiBfdGVtcFBhbkFyZWFTaXplLnkpID8gXHJcblx0XHRcdFx0XHRcdFx0TWF0aC5yb3VuZChfdGVtcFBhbkFyZWFTaXplLnkgLSByZWFsUGFuRWxlbWVudEgpICsgaXRlbS52R2FwLnRvcCA6IFxyXG5cdFx0XHRcdFx0XHRcdGJvdW5kcy5jZW50ZXIueTtcclxuXHRcdFxyXG5cdFx0Ly8gbWluaW11bSBwYW4gcG9zaXRpb25cclxuXHRcdGJvdW5kcy5taW4ueCA9IChyZWFsUGFuRWxlbWVudFcgPiBfdGVtcFBhbkFyZWFTaXplLngpID8gMCA6IGJvdW5kcy5jZW50ZXIueDtcclxuXHRcdGJvdW5kcy5taW4ueSA9IChyZWFsUGFuRWxlbWVudEggPiBfdGVtcFBhbkFyZWFTaXplLnkpID8gaXRlbS52R2FwLnRvcCA6IGJvdW5kcy5jZW50ZXIueTtcclxuXHR9LFxyXG5cdF9jYWxjdWxhdGVJdGVtU2l6ZSA9IGZ1bmN0aW9uKGl0ZW0sIHZpZXdwb3J0U2l6ZSwgem9vbUxldmVsKSB7XHJcblxyXG5cdFx0aWYgKGl0ZW0uc3JjICYmICFpdGVtLmxvYWRFcnJvcikge1xyXG5cdFx0XHR2YXIgaXNJbml0aWFsID0gIXpvb21MZXZlbDtcclxuXHRcdFx0XHJcblx0XHRcdGlmKGlzSW5pdGlhbCkge1xyXG5cdFx0XHRcdGlmKCFpdGVtLnZHYXApIHtcclxuXHRcdFx0XHRcdGl0ZW0udkdhcCA9IHt0b3A6MCxib3R0b206MH07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGFsbG93cyBvdmVycmlkaW5nIHZlcnRpY2FsIG1hcmdpbiBmb3IgaW5kaXZpZHVhbCBpdGVtc1xyXG5cdFx0XHRcdF9zaG91dCgncGFyc2VWZXJ0aWNhbE1hcmdpbicsIGl0ZW0pO1xyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0X3RlbXBQYW5BcmVhU2l6ZS54ID0gdmlld3BvcnRTaXplLng7XHJcblx0XHRcdF90ZW1wUGFuQXJlYVNpemUueSA9IHZpZXdwb3J0U2l6ZS55IC0gaXRlbS52R2FwLnRvcCAtIGl0ZW0udkdhcC5ib3R0b207XHJcblxyXG5cdFx0XHRpZiAoaXNJbml0aWFsKSB7XHJcblx0XHRcdFx0dmFyIGhSYXRpbyA9IF90ZW1wUGFuQXJlYVNpemUueCAvIGl0ZW0udztcclxuXHRcdFx0XHR2YXIgdlJhdGlvID0gX3RlbXBQYW5BcmVhU2l6ZS55IC8gaXRlbS5oO1xyXG5cclxuXHRcdFx0XHRpdGVtLmZpdFJhdGlvID0gaFJhdGlvIDwgdlJhdGlvID8gaFJhdGlvIDogdlJhdGlvO1xyXG5cdFx0XHRcdC8vaXRlbS5maWxsUmF0aW8gPSBoUmF0aW8gPiB2UmF0aW8gPyBoUmF0aW8gOiB2UmF0aW87XHJcblxyXG5cdFx0XHRcdHZhciBzY2FsZU1vZGUgPSBfb3B0aW9ucy5zY2FsZU1vZGU7XHJcblxyXG5cdFx0XHRcdGlmIChzY2FsZU1vZGUgPT09ICdvcmlnJykge1xyXG5cdFx0XHRcdFx0em9vbUxldmVsID0gMTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHNjYWxlTW9kZSA9PT0gJ2ZpdCcpIHtcclxuXHRcdFx0XHRcdHpvb21MZXZlbCA9IGl0ZW0uZml0UmF0aW87XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAoem9vbUxldmVsID4gMSkge1xyXG5cdFx0XHRcdFx0em9vbUxldmVsID0gMTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGl0ZW0uaW5pdGlhbFpvb21MZXZlbCA9IHpvb21MZXZlbDtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZighaXRlbS5ib3VuZHMpIHtcclxuXHRcdFx0XHRcdC8vIHJldXNlIGJvdW5kcyBvYmplY3RcclxuXHRcdFx0XHRcdGl0ZW0uYm91bmRzID0gX2dldFplcm9Cb3VuZHMoKTsgXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZighem9vbUxldmVsKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRfY2FsY3VsYXRlU2luZ2xlSXRlbVBhbkJvdW5kcyhpdGVtLCBpdGVtLncgKiB6b29tTGV2ZWwsIGl0ZW0uaCAqIHpvb21MZXZlbCk7XHJcblxyXG5cdFx0XHRpZiAoaXNJbml0aWFsICYmIHpvb21MZXZlbCA9PT0gaXRlbS5pbml0aWFsWm9vbUxldmVsKSB7XHJcblx0XHRcdFx0aXRlbS5pbml0aWFsUG9zaXRpb24gPSBpdGVtLmJvdW5kcy5jZW50ZXI7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBpdGVtLmJvdW5kcztcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGl0ZW0udyA9IGl0ZW0uaCA9IDA7XHJcblx0XHRcdGl0ZW0uaW5pdGlhbFpvb21MZXZlbCA9IGl0ZW0uZml0UmF0aW8gPSAxO1xyXG5cdFx0XHRpdGVtLmJvdW5kcyA9IF9nZXRaZXJvQm91bmRzKCk7XHJcblx0XHRcdGl0ZW0uaW5pdGlhbFBvc2l0aW9uID0gaXRlbS5ib3VuZHMuY2VudGVyO1xyXG5cclxuXHRcdFx0Ly8gaWYgaXQncyBub3QgaW1hZ2UsIHdlIHJldHVybiB6ZXJvIGJvdW5kcyAoY29udGVudCBpcyBub3Qgem9vbWFibGUpXHJcblx0XHRcdHJldHVybiBpdGVtLmJvdW5kcztcclxuXHRcdH1cclxuXHRcdFxyXG5cdH0sXHJcblxyXG5cdFxyXG5cclxuXHJcblx0X2FwcGVuZEltYWdlID0gZnVuY3Rpb24oaW5kZXgsIGl0ZW0sIGJhc2VEaXYsIGltZywgcHJldmVudEFuaW1hdGlvbiwga2VlcFBsYWNlaG9sZGVyKSB7XHJcblx0XHRcclxuXHJcblx0XHRpZihpdGVtLmxvYWRFcnJvcikge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0aWYoaW1nKSB7XHJcblxyXG5cdFx0XHRpdGVtLmltYWdlQXBwZW5kZWQgPSB0cnVlO1xyXG5cdFx0XHRfc2V0SW1hZ2VTaXplKGl0ZW0sIGltZywgKGl0ZW0gPT09IHNlbGYuY3Vyckl0ZW0gJiYgX3JlbmRlck1heFJlc29sdXRpb24pICk7XHJcblx0XHRcdFxyXG5cdFx0XHRiYXNlRGl2LmFwcGVuZENoaWxkKGltZyk7XHJcblxyXG5cdFx0XHRpZihrZWVwUGxhY2Vob2xkZXIpIHtcclxuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0aWYoaXRlbSAmJiBpdGVtLmxvYWRlZCAmJiBpdGVtLnBsYWNlaG9sZGVyKSB7XHJcblx0XHRcdFx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlciA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSwgNTAwKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblx0XHJcblxyXG5cclxuXHRfcHJlbG9hZEltYWdlID0gZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0aXRlbS5sb2FkaW5nID0gdHJ1ZTtcclxuXHRcdGl0ZW0ubG9hZGVkID0gZmFsc2U7XHJcblx0XHR2YXIgaW1nID0gaXRlbS5pbWcgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2ltZycsICdpbWcnKTtcclxuXHRcdHZhciBvbkNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGl0ZW0ubG9hZGluZyA9IGZhbHNlO1xyXG5cdFx0XHRpdGVtLmxvYWRlZCA9IHRydWU7XHJcblxyXG5cdFx0XHRpZihpdGVtLmxvYWRDb21wbGV0ZSkge1xyXG5cdFx0XHRcdGl0ZW0ubG9hZENvbXBsZXRlKGl0ZW0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGl0ZW0uaW1nID0gbnVsbDsgLy8gbm8gbmVlZCB0byBzdG9yZSBpbWFnZSBvYmplY3RcclxuXHRcdFx0fVxyXG5cdFx0XHRpbWcub25sb2FkID0gaW1nLm9uZXJyb3IgPSBudWxsO1xyXG5cdFx0XHRpbWcgPSBudWxsO1xyXG5cdFx0fTtcclxuXHRcdGltZy5vbmxvYWQgPSBvbkNvbXBsZXRlO1xyXG5cdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aXRlbS5sb2FkRXJyb3IgPSB0cnVlO1xyXG5cdFx0XHRvbkNvbXBsZXRlKCk7XHJcblx0XHR9O1x0XHRcclxuXHJcblx0XHRpbWcuc3JjID0gaXRlbS5zcmM7Ly8gKyAnP2E9JyArIE1hdGgucmFuZG9tKCk7XHJcblxyXG5cdFx0cmV0dXJuIGltZztcclxuXHR9LFxyXG5cdF9jaGVja0ZvckVycm9yID0gZnVuY3Rpb24oaXRlbSwgY2xlYW5VcCkge1xyXG5cdFx0aWYoaXRlbS5zcmMgJiYgaXRlbS5sb2FkRXJyb3IgJiYgaXRlbS5jb250YWluZXIpIHtcclxuXHJcblx0XHRcdGlmKGNsZWFuVXApIHtcclxuXHRcdFx0XHRpdGVtLmNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aXRlbS5jb250YWluZXIuaW5uZXJIVE1MID0gX29wdGlvbnMuZXJyb3JNc2cucmVwbGFjZSgnJXVybCUnLCAgaXRlbS5zcmMgKTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdH0sXHJcblx0X3NldEltYWdlU2l6ZSA9IGZ1bmN0aW9uKGl0ZW0sIGltZywgbWF4UmVzKSB7XHJcblx0XHRpZighaXRlbS5zcmMpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmKCFpbWcpIHtcclxuXHRcdFx0aW1nID0gaXRlbS5jb250YWluZXIubGFzdENoaWxkO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB3ID0gbWF4UmVzID8gaXRlbS53IDogTWF0aC5yb3VuZChpdGVtLncgKiBpdGVtLmZpdFJhdGlvKSxcclxuXHRcdFx0aCA9IG1heFJlcyA/IGl0ZW0uaCA6IE1hdGgucm91bmQoaXRlbS5oICogaXRlbS5maXRSYXRpbyk7XHJcblx0XHRcclxuXHRcdGlmKGl0ZW0ucGxhY2Vob2xkZXIgJiYgIWl0ZW0ubG9hZGVkKSB7XHJcblx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcclxuXHRcdFx0aXRlbS5wbGFjZWhvbGRlci5zdHlsZS5oZWlnaHQgPSBoICsgJ3B4JztcclxuXHRcdH1cclxuXHJcblx0XHRpbWcuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcclxuXHRcdGltZy5zdHlsZS5oZWlnaHQgPSBoICsgJ3B4JztcclxuXHR9LFxyXG5cdF9hcHBlbmRJbWFnZXNQb29sID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0aWYoX2ltYWdlc1RvQXBwZW5kUG9vbC5sZW5ndGgpIHtcclxuXHRcdFx0dmFyIHBvb2xJdGVtO1xyXG5cclxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IF9pbWFnZXNUb0FwcGVuZFBvb2wubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRwb29sSXRlbSA9IF9pbWFnZXNUb0FwcGVuZFBvb2xbaV07XHJcblx0XHRcdFx0aWYoIHBvb2xJdGVtLmhvbGRlci5pbmRleCA9PT0gcG9vbEl0ZW0uaW5kZXggKSB7XHJcblx0XHRcdFx0XHRfYXBwZW5kSW1hZ2UocG9vbEl0ZW0uaW5kZXgsIHBvb2xJdGVtLml0ZW0sIHBvb2xJdGVtLmJhc2VEaXYsIHBvb2xJdGVtLmltZywgZmFsc2UsIHBvb2xJdGVtLmNsZWFyUGxhY2Vob2xkZXIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRfaW1hZ2VzVG9BcHBlbmRQb29sID0gW107XHJcblx0XHR9XHJcblx0fTtcclxuXHRcclxuXHJcblxyXG5fcmVnaXN0ZXJNb2R1bGUoJ0NvbnRyb2xsZXInLCB7XHJcblxyXG5cdHB1YmxpY01ldGhvZHM6IHtcclxuXHJcblx0XHRsYXp5TG9hZEl0ZW06IGZ1bmN0aW9uKGluZGV4KSB7XHJcblx0XHRcdGluZGV4ID0gX2dldExvb3BlZElkKGluZGV4KTtcclxuXHRcdFx0dmFyIGl0ZW0gPSBfZ2V0SXRlbUF0KGluZGV4KTtcclxuXHJcblx0XHRcdGlmKCFpdGVtIHx8ICgoaXRlbS5sb2FkZWQgfHwgaXRlbS5sb2FkaW5nKSAmJiAhX2l0ZW1zTmVlZFVwZGF0ZSkpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdF9zaG91dCgnZ2V0dGluZ0RhdGEnLCBpbmRleCwgaXRlbSk7XHJcblxyXG5cdFx0XHRpZiAoIWl0ZW0uc3JjKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRfcHJlbG9hZEltYWdlKGl0ZW0pO1xyXG5cdFx0fSxcclxuXHRcdGluaXRDb250cm9sbGVyOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZnJhbWV3b3JrLmV4dGVuZChfb3B0aW9ucywgX2NvbnRyb2xsZXJEZWZhdWx0T3B0aW9ucywgdHJ1ZSk7XHJcblx0XHRcdHNlbGYuaXRlbXMgPSBfaXRlbXMgPSBpdGVtcztcclxuXHRcdFx0X2dldEl0ZW1BdCA9IHNlbGYuZ2V0SXRlbUF0O1xyXG5cdFx0XHRfZ2V0TnVtSXRlbXMgPSBfb3B0aW9ucy5nZXROdW1JdGVtc0ZuOyAvL3NlbGYuZ2V0TnVtSXRlbXM7XHJcblxyXG5cclxuXHJcblx0XHRcdF9pbml0aWFsSXNMb29wID0gX29wdGlvbnMubG9vcDtcclxuXHRcdFx0aWYoX2dldE51bUl0ZW1zKCkgPCAzKSB7XHJcblx0XHRcdFx0X29wdGlvbnMubG9vcCA9IGZhbHNlOyAvLyBkaXNhYmxlIGxvb3AgaWYgbGVzcyB0aGVuIDMgaXRlbXNcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0X2xpc3RlbignYmVmb3JlQ2hhbmdlJywgZnVuY3Rpb24oZGlmZikge1xyXG5cclxuXHRcdFx0XHR2YXIgcCA9IF9vcHRpb25zLnByZWxvYWQsXHJcblx0XHRcdFx0XHRpc05leHQgPSBkaWZmID09PSBudWxsID8gdHJ1ZSA6IChkaWZmID49IDApLFxyXG5cdFx0XHRcdFx0cHJlbG9hZEJlZm9yZSA9IE1hdGgubWluKHBbMF0sIF9nZXROdW1JdGVtcygpICksXHJcblx0XHRcdFx0XHRwcmVsb2FkQWZ0ZXIgPSBNYXRoLm1pbihwWzFdLCBfZ2V0TnVtSXRlbXMoKSApLFxyXG5cdFx0XHRcdFx0aTtcclxuXHJcblxyXG5cdFx0XHRcdGZvcihpID0gMTsgaSA8PSAoaXNOZXh0ID8gcHJlbG9hZEFmdGVyIDogcHJlbG9hZEJlZm9yZSk7IGkrKykge1xyXG5cdFx0XHRcdFx0c2VsZi5sYXp5TG9hZEl0ZW0oX2N1cnJlbnRJdGVtSW5kZXgraSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZvcihpID0gMTsgaSA8PSAoaXNOZXh0ID8gcHJlbG9hZEJlZm9yZSA6IHByZWxvYWRBZnRlcik7IGkrKykge1xyXG5cdFx0XHRcdFx0c2VsZi5sYXp5TG9hZEl0ZW0oX2N1cnJlbnRJdGVtSW5kZXgtaSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdF9saXN0ZW4oJ2luaXRpYWxMYXlvdXQnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzZWxmLmN1cnJJdGVtLmluaXRpYWxMYXlvdXQgPSBfb3B0aW9ucy5nZXRUaHVtYkJvdW5kc0ZuICYmIF9vcHRpb25zLmdldFRodW1iQm91bmRzRm4oX2N1cnJlbnRJdGVtSW5kZXgpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdF9saXN0ZW4oJ21haW5TY3JvbGxBbmltQ29tcGxldGUnLCBfYXBwZW5kSW1hZ2VzUG9vbCk7XHJcblx0XHRcdF9saXN0ZW4oJ2luaXRpYWxab29tSW5FbmQnLCBfYXBwZW5kSW1hZ2VzUG9vbCk7XHJcblxyXG5cclxuXHJcblx0XHRcdF9saXN0ZW4oJ2Rlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgaXRlbTtcclxuXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgX2l0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRpdGVtID0gX2l0ZW1zW2ldO1xyXG5cdFx0XHRcdFx0Ly8gcmVtb3ZlIHJlZmVyZW5jZSB0byBET00gZWxlbWVudHMsIGZvciBHQ1xyXG5cdFx0XHRcdFx0aWYoaXRlbS5jb250YWluZXIpIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5jb250YWluZXIgPSBudWxsOyBcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmKGl0ZW0ucGxhY2Vob2xkZXIpIHtcclxuXHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlciA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZihpdGVtLmltZykge1xyXG5cdFx0XHRcdFx0XHRpdGVtLmltZyA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZihpdGVtLnByZWxvYWRlcikge1xyXG5cdFx0XHRcdFx0XHRpdGVtLnByZWxvYWRlciA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZihpdGVtLmxvYWRFcnJvcikge1xyXG5cdFx0XHRcdFx0XHRpdGVtLmxvYWRlZCA9IGl0ZW0ubG9hZEVycm9yID0gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdF9pbWFnZXNUb0FwcGVuZFBvb2wgPSBudWxsO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sXHJcblxyXG5cclxuXHRcdGdldEl0ZW1BdDogZnVuY3Rpb24oaW5kZXgpIHtcclxuXHRcdFx0aWYgKGluZGV4ID49IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gX2l0ZW1zW2luZGV4XSAhPT0gdW5kZWZpbmVkID8gX2l0ZW1zW2luZGV4XSA6IGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0sXHJcblxyXG5cdFx0YWxsb3dQcm9ncmVzc2l2ZUltZzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdC8vIDEuIFByb2dyZXNzaXZlIGltYWdlIGxvYWRpbmcgaXNuJ3Qgd29ya2luZyBvbiB3ZWJraXQvYmxpbmsgXHJcblx0XHRcdC8vICAgIHdoZW4gaHctYWNjZWxlcmF0aW9uIChlLmcuIHRyYW5zbGF0ZVopIGlzIGFwcGxpZWQgdG8gSU1HIGVsZW1lbnQuXHJcblx0XHRcdC8vICAgIFRoYXQncyB3aHkgaW4gUGhvdG9Td2lwZSBwYXJlbnQgZWxlbWVudCBnZXRzIHpvb20gdHJhbnNmb3JtLCBub3QgaW1hZ2UgaXRzZWxmLlxyXG5cdFx0XHQvLyAgICBcclxuXHRcdFx0Ly8gMi4gUHJvZ3Jlc3NpdmUgaW1hZ2UgbG9hZGluZyBzb21ldGltZXMgYmxpbmtzIGluIHdlYmtpdC9ibGluayB3aGVuIGFwcGx5aW5nIGFuaW1hdGlvbiB0byBwYXJlbnQgZWxlbWVudC5cclxuXHRcdFx0Ly8gICAgVGhhdCdzIHdoeSBpdCdzIGRpc2FibGVkIG9uIHRvdWNoIGRldmljZXMgKG1haW5seSBiZWNhdXNlIG9mIHN3aXBlIHRyYW5zaXRpb24pXHJcblx0XHRcdC8vICAgIFxyXG5cdFx0XHQvLyAzLiBQcm9ncmVzc2l2ZSBpbWFnZSBsb2FkaW5nIHNvbWV0aW1lcyBkb2Vzbid0IHdvcmsgaW4gSUUgKHVwIHRvIDExKS5cclxuXHJcblx0XHRcdC8vIERvbid0IGFsbG93IHByb2dyZXNzaXZlIGxvYWRpbmcgb24gbm9uLWxhcmdlIHRvdWNoIGRldmljZXNcclxuXHRcdFx0cmV0dXJuIF9vcHRpb25zLmZvcmNlUHJvZ3Jlc3NpdmVMb2FkaW5nIHx8ICFfbGlrZWx5VG91Y2hEZXZpY2UgfHwgX29wdGlvbnMubW91c2VVc2VkIHx8IHNjcmVlbi53aWR0aCA+IDEyMDA7IFxyXG5cdFx0XHQvLyAxMjAwIC0gdG8gZWxpbWluYXRlIHRvdWNoIGRldmljZXMgd2l0aCBsYXJnZSBzY3JlZW4gKGxpa2UgQ2hyb21lYm9vayBQaXhlbClcclxuXHRcdH0sXHJcblxyXG5cdFx0c2V0Q29udGVudDogZnVuY3Rpb24oaG9sZGVyLCBpbmRleCkge1xyXG5cclxuXHRcdFx0aWYoX29wdGlvbnMubG9vcCkge1xyXG5cdFx0XHRcdGluZGV4ID0gX2dldExvb3BlZElkKGluZGV4KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIHByZXZJdGVtID0gc2VsZi5nZXRJdGVtQXQoaG9sZGVyLmluZGV4KTtcclxuXHRcdFx0aWYocHJldkl0ZW0pIHtcclxuXHRcdFx0XHRwcmV2SXRlbS5jb250YWluZXIgPSBudWxsO1xyXG5cdFx0XHR9XHJcblx0XHJcblx0XHRcdHZhciBpdGVtID0gc2VsZi5nZXRJdGVtQXQoaW5kZXgpLFxyXG5cdFx0XHRcdGltZztcclxuXHRcdFx0XHJcblx0XHRcdGlmKCFpdGVtKSB7XHJcblx0XHRcdFx0aG9sZGVyLmVsLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gYWxsb3cgdG8gb3ZlcnJpZGUgZGF0YVxyXG5cdFx0XHRfc2hvdXQoJ2dldHRpbmdEYXRhJywgaW5kZXgsIGl0ZW0pO1xyXG5cclxuXHRcdFx0aG9sZGVyLmluZGV4ID0gaW5kZXg7XHJcblx0XHRcdGhvbGRlci5pdGVtID0gaXRlbTtcclxuXHJcblx0XHRcdC8vIGJhc2UgY29udGFpbmVyIERJViBpcyBjcmVhdGVkIG9ubHkgb25jZSBmb3IgZWFjaCBvZiAzIGhvbGRlcnNcclxuXHRcdFx0dmFyIGJhc2VEaXYgPSBpdGVtLmNvbnRhaW5lciA9IGZyYW1ld29yay5jcmVhdGVFbCgncHN3cF9fem9vbS13cmFwJyk7IFxyXG5cclxuXHRcdFx0XHJcblxyXG5cdFx0XHRpZighaXRlbS5zcmMgJiYgaXRlbS5odG1sKSB7XHJcblx0XHRcdFx0aWYoaXRlbS5odG1sLnRhZ05hbWUpIHtcclxuXHRcdFx0XHRcdGJhc2VEaXYuYXBwZW5kQ2hpbGQoaXRlbS5odG1sKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0YmFzZURpdi5pbm5lckhUTUwgPSBpdGVtLmh0bWw7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRfY2hlY2tGb3JFcnJvcihpdGVtKTtcclxuXHJcblx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShpdGVtLCBfdmlld3BvcnRTaXplKTtcclxuXHRcdFx0XHJcblx0XHRcdGlmKGl0ZW0uc3JjICYmICFpdGVtLmxvYWRFcnJvciAmJiAhaXRlbS5sb2FkZWQpIHtcclxuXHJcblx0XHRcdFx0aXRlbS5sb2FkQ29tcGxldGUgPSBmdW5jdGlvbihpdGVtKSB7XHJcblxyXG5cdFx0XHRcdFx0Ly8gZ2FsbGVyeSBjbG9zZWQgYmVmb3JlIGltYWdlIGZpbmlzaGVkIGxvYWRpbmdcclxuXHRcdFx0XHRcdGlmKCFfaXNPcGVuKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHQvLyBjaGVjayBpZiBob2xkZXIgaGFzbid0IGNoYW5nZWQgd2hpbGUgaW1hZ2Ugd2FzIGxvYWRpbmdcclxuXHRcdFx0XHRcdGlmKGhvbGRlciAmJiBob2xkZXIuaW5kZXggPT09IGluZGV4ICkge1xyXG5cdFx0XHRcdFx0XHRpZiggX2NoZWNrRm9yRXJyb3IoaXRlbSwgdHJ1ZSkgKSB7XHJcblx0XHRcdFx0XHRcdFx0aXRlbS5sb2FkQ29tcGxldGUgPSBpdGVtLmltZyA9IG51bGw7XHJcblx0XHRcdFx0XHRcdFx0X2NhbGN1bGF0ZUl0ZW1TaXplKGl0ZW0sIF92aWV3cG9ydFNpemUpO1xyXG5cdFx0XHRcdFx0XHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0oaXRlbSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmKGhvbGRlci5pbmRleCA9PT0gX2N1cnJlbnRJdGVtSW5kZXgpIHtcclxuXHRcdFx0XHRcdFx0XHRcdC8vIHJlY2FsY3VsYXRlIGRpbWVuc2lvbnNcclxuXHRcdFx0XHRcdFx0XHRcdHNlbGYudXBkYXRlQ3Vyclpvb21JdGVtKCk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiggIWl0ZW0uaW1hZ2VBcHBlbmRlZCApIHtcclxuXHRcdFx0XHRcdFx0XHRpZihfZmVhdHVyZXMudHJhbnNmb3JtICYmIChfbWFpblNjcm9sbEFuaW1hdGluZyB8fCBfaW5pdGlhbFpvb21SdW5uaW5nKSApIHtcclxuXHRcdFx0XHRcdFx0XHRcdF9pbWFnZXNUb0FwcGVuZFBvb2wucHVzaCh7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGl0ZW06aXRlbSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0YmFzZURpdjpiYXNlRGl2LFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRpbWc6aXRlbS5pbWcsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OmluZGV4LFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRob2xkZXI6aG9sZGVyLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRjbGVhclBsYWNlaG9sZGVyOnRydWVcclxuXHRcdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0XHRfYXBwZW5kSW1hZ2UoaW5kZXgsIGl0ZW0sIGJhc2VEaXYsIGl0ZW0uaW1nLCBfbWFpblNjcm9sbEFuaW1hdGluZyB8fCBfaW5pdGlhbFpvb21SdW5uaW5nLCB0cnVlKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0Ly8gcmVtb3ZlIHByZWxvYWRlciAmIG1pbmktaW1nXHJcblx0XHRcdFx0XHRcdFx0aWYoIV9pbml0aWFsWm9vbVJ1bm5pbmcgJiYgaXRlbS5wbGFjZWhvbGRlcikge1xyXG5cdFx0XHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlciA9IG51bGw7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aXRlbS5sb2FkQ29tcGxldGUgPSBudWxsO1xyXG5cdFx0XHRcdFx0aXRlbS5pbWcgPSBudWxsOyAvLyBubyBuZWVkIHRvIHN0b3JlIGltYWdlIGVsZW1lbnQgYWZ0ZXIgaXQncyBhZGRlZFxyXG5cclxuXHRcdFx0XHRcdF9zaG91dCgnaW1hZ2VMb2FkQ29tcGxldGUnLCBpbmRleCwgaXRlbSk7XHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0aWYoZnJhbWV3b3JrLmZlYXR1cmVzLnRyYW5zZm9ybSkge1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR2YXIgcGxhY2Vob2xkZXJDbGFzc05hbWUgPSAncHN3cF9faW1nIHBzd3BfX2ltZy0tcGxhY2Vob2xkZXInOyBcclxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyQ2xhc3NOYW1lICs9IChpdGVtLm1zcmMgPyAnJyA6ICcgcHN3cF9faW1nLS1wbGFjZWhvbGRlci0tYmxhbmsnKTtcclxuXHJcblx0XHRcdFx0XHR2YXIgcGxhY2Vob2xkZXIgPSBmcmFtZXdvcmsuY3JlYXRlRWwocGxhY2Vob2xkZXJDbGFzc05hbWUsIGl0ZW0ubXNyYyA/ICdpbWcnIDogJycpO1xyXG5cdFx0XHRcdFx0aWYoaXRlbS5tc3JjKSB7XHJcblx0XHRcdFx0XHRcdHBsYWNlaG9sZGVyLnNyYyA9IGl0ZW0ubXNyYztcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0X3NldEltYWdlU2l6ZShpdGVtLCBwbGFjZWhvbGRlcik7XHJcblxyXG5cdFx0XHRcdFx0YmFzZURpdi5hcHBlbmRDaGlsZChwbGFjZWhvbGRlcik7XHJcblx0XHRcdFx0XHRpdGVtLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHJcblx0XHRcdFx0XHJcblxyXG5cdFx0XHRcdGlmKCFpdGVtLmxvYWRpbmcpIHtcclxuXHRcdFx0XHRcdF9wcmVsb2FkSW1hZ2UoaXRlbSk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHJcblx0XHRcdFx0aWYoIHNlbGYuYWxsb3dQcm9ncmVzc2l2ZUltZygpICkge1xyXG5cdFx0XHRcdFx0Ly8ganVzdCBhcHBlbmQgaW1hZ2VcclxuXHRcdFx0XHRcdGlmKCFfaW5pdGlhbENvbnRlbnRTZXQgJiYgX2ZlYXR1cmVzLnRyYW5zZm9ybSkge1xyXG5cdFx0XHRcdFx0XHRfaW1hZ2VzVG9BcHBlbmRQb29sLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRcdGl0ZW06aXRlbSwgXHJcblx0XHRcdFx0XHRcdFx0YmFzZURpdjpiYXNlRGl2LCBcclxuXHRcdFx0XHRcdFx0XHRpbWc6aXRlbS5pbWcsIFxyXG5cdFx0XHRcdFx0XHRcdGluZGV4OmluZGV4LCBcclxuXHRcdFx0XHRcdFx0XHRob2xkZXI6aG9sZGVyXHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0X2FwcGVuZEltYWdlKGluZGV4LCBpdGVtLCBiYXNlRGl2LCBpdGVtLmltZywgdHJ1ZSwgdHJ1ZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9IGVsc2UgaWYoaXRlbS5zcmMgJiYgIWl0ZW0ubG9hZEVycm9yKSB7XHJcblx0XHRcdFx0Ly8gaW1hZ2Ugb2JqZWN0IGlzIGNyZWF0ZWQgZXZlcnkgdGltZSwgZHVlIHRvIGJ1Z3Mgb2YgaW1hZ2UgbG9hZGluZyAmIGRlbGF5IHdoZW4gc3dpdGNoaW5nIGltYWdlc1xyXG5cdFx0XHRcdGltZyA9IGZyYW1ld29yay5jcmVhdGVFbCgncHN3cF9faW1nJywgJ2ltZycpO1xyXG5cdFx0XHRcdGltZy5zdHlsZS5vcGFjaXR5ID0gMTtcclxuXHRcdFx0XHRpbWcuc3JjID0gaXRlbS5zcmM7XHJcblx0XHRcdFx0X3NldEltYWdlU2l6ZShpdGVtLCBpbWcpO1xyXG5cdFx0XHRcdF9hcHBlbmRJbWFnZShpbmRleCwgaXRlbSwgYmFzZURpdiwgaW1nLCB0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHJcblx0XHRcdGlmKCFfaW5pdGlhbENvbnRlbnRTZXQgJiYgaW5kZXggPT09IF9jdXJyZW50SXRlbUluZGV4KSB7XHJcblx0XHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gYmFzZURpdi5zdHlsZTtcclxuXHRcdFx0XHRfc2hvd09ySGlkZShpdGVtLCAoaW1nIHx8aXRlbS5pbWcpICk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0X2FwcGx5Wm9vbVBhblRvSXRlbShpdGVtKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aG9sZGVyLmVsLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0XHRob2xkZXIuZWwuYXBwZW5kQ2hpbGQoYmFzZURpdik7XHJcblx0XHR9LFxyXG5cclxuXHRcdGNsZWFuU2xpZGU6IGZ1bmN0aW9uKCBpdGVtICkge1xyXG5cdFx0XHRpZihpdGVtLmltZyApIHtcclxuXHRcdFx0XHRpdGVtLmltZy5vbmxvYWQgPSBpdGVtLmltZy5vbmVycm9yID0gbnVsbDtcclxuXHRcdFx0fVxyXG5cdFx0XHRpdGVtLmxvYWRlZCA9IGl0ZW0ubG9hZGluZyA9IGl0ZW0uaW1nID0gaXRlbS5pbWFnZUFwcGVuZGVkID0gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufSk7XHJcblxyXG4vKj4+aXRlbXMtY29udHJvbGxlciovXHJcblxyXG4vKj4+dGFwKi9cclxuLyoqXHJcbiAqIHRhcC5qczpcclxuICpcclxuICogRGlzcGxhdGNoZXMgdGFwIGFuZCBkb3VibGUtdGFwIGV2ZW50cy5cclxuICogXHJcbiAqL1xyXG5cclxudmFyIHRhcFRpbWVyLFxyXG5cdHRhcFJlbGVhc2VQb2ludCA9IHt9LFxyXG5cdF9kaXNwYXRjaFRhcEV2ZW50ID0gZnVuY3Rpb24ob3JpZ0V2ZW50LCByZWxlYXNlUG9pbnQsIHBvaW50ZXJUeXBlKSB7XHRcdFxyXG5cdFx0dmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCggJ0N1c3RvbUV2ZW50JyApLFxyXG5cdFx0XHRlRGV0YWlsID0ge1xyXG5cdFx0XHRcdG9yaWdFdmVudDpvcmlnRXZlbnQsIFxyXG5cdFx0XHRcdHRhcmdldDpvcmlnRXZlbnQudGFyZ2V0LCBcclxuXHRcdFx0XHRyZWxlYXNlUG9pbnQ6IHJlbGVhc2VQb2ludCwgXHJcblx0XHRcdFx0cG9pbnRlclR5cGU6cG9pbnRlclR5cGUgfHwgJ3RvdWNoJ1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdGUuaW5pdEN1c3RvbUV2ZW50KCAncHN3cFRhcCcsIHRydWUsIHRydWUsIGVEZXRhaWwgKTtcclxuXHRcdG9yaWdFdmVudC50YXJnZXQuZGlzcGF0Y2hFdmVudChlKTtcclxuXHR9O1xyXG5cclxuX3JlZ2lzdGVyTW9kdWxlKCdUYXAnLCB7XHJcblx0cHVibGljTWV0aG9kczoge1xyXG5cdFx0aW5pdFRhcDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdF9saXN0ZW4oJ2ZpcnN0VG91Y2hTdGFydCcsIHNlbGYub25UYXBTdGFydCk7XHJcblx0XHRcdF9saXN0ZW4oJ3RvdWNoUmVsZWFzZScsIHNlbGYub25UYXBSZWxlYXNlKTtcclxuXHRcdFx0X2xpc3RlbignZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHRhcFJlbGVhc2VQb2ludCA9IHt9O1xyXG5cdFx0XHRcdHRhcFRpbWVyID0gbnVsbDtcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cdFx0b25UYXBTdGFydDogZnVuY3Rpb24odG91Y2hMaXN0KSB7XHJcblx0XHRcdGlmKHRvdWNoTGlzdC5sZW5ndGggPiAxKSB7XHJcblx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRhcFRpbWVyKTtcclxuXHRcdFx0XHR0YXBUaW1lciA9IG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHRvblRhcFJlbGVhc2U6IGZ1bmN0aW9uKGUsIHJlbGVhc2VQb2ludCkge1xyXG5cdFx0XHRpZighcmVsZWFzZVBvaW50KSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZighX21vdmVkICYmICFfaXNNdWx0aXRvdWNoICYmICFfbnVtQW5pbWF0aW9ucykge1xyXG5cdFx0XHRcdHZhciBwMCA9IHJlbGVhc2VQb2ludDtcclxuXHRcdFx0XHRpZih0YXBUaW1lcikge1xyXG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRhcFRpbWVyKTtcclxuXHRcdFx0XHRcdHRhcFRpbWVyID0gbnVsbDtcclxuXHJcblx0XHRcdFx0XHQvLyBDaGVjayBpZiB0YXBlZCBvbiB0aGUgc2FtZSBwbGFjZVxyXG5cdFx0XHRcdFx0aWYgKCBfaXNOZWFyYnlQb2ludHMocDAsIHRhcFJlbGVhc2VQb2ludCkgKSB7XHJcblx0XHRcdFx0XHRcdF9zaG91dCgnZG91YmxlVGFwJywgcDApO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZihyZWxlYXNlUG9pbnQudHlwZSA9PT0gJ21vdXNlJykge1xyXG5cdFx0XHRcdFx0X2Rpc3BhdGNoVGFwRXZlbnQoZSwgcmVsZWFzZVBvaW50LCAnbW91c2UnKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHZhciBjbGlja2VkVGFnTmFtZSA9IGUudGFyZ2V0LnRhZ05hbWUudG9VcHBlckNhc2UoKTtcclxuXHRcdFx0XHQvLyBhdm9pZCBkb3VibGUgdGFwIGRlbGF5IG9uIGJ1dHRvbnMgYW5kIGVsZW1lbnRzIHRoYXQgaGF2ZSBjbGFzcyBwc3dwX19zaW5nbGUtdGFwXHJcblx0XHRcdFx0aWYoY2xpY2tlZFRhZ05hbWUgPT09ICdCVVRUT04nIHx8IGZyYW1ld29yay5oYXNDbGFzcyhlLnRhcmdldCwgJ3Bzd3BfX3NpbmdsZS10YXAnKSApIHtcclxuXHRcdFx0XHRcdF9kaXNwYXRjaFRhcEV2ZW50KGUsIHJlbGVhc2VQb2ludCk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRfZXF1YWxpemVQb2ludHModGFwUmVsZWFzZVBvaW50LCBwMCk7XHJcblxyXG5cdFx0XHRcdHRhcFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdF9kaXNwYXRjaFRhcEV2ZW50KGUsIHJlbGVhc2VQb2ludCk7XHJcblx0XHRcdFx0XHR0YXBUaW1lciA9IG51bGw7XHJcblx0XHRcdFx0fSwgMzAwKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufSk7XHJcblxyXG4vKj4+dGFwKi9cclxuXHJcbi8qPj5kZXNrdG9wLXpvb20qL1xyXG4vKipcclxuICpcclxuICogZGVza3RvcC16b29tLmpzOlxyXG4gKlxyXG4gKiAtIEJpbmRzIG1vdXNld2hlZWwgZXZlbnQgZm9yIHBhbmluZyB6b29tZWQgaW1hZ2UuXHJcbiAqIC0gTWFuYWdlcyBcImRyYWdnaW5nXCIsIFwiem9vbWVkLWluXCIsIFwiem9vbS1vdXRcIiBjbGFzc2VzLlxyXG4gKiAgICh3aGljaCBhcmUgdXNlZCBmb3IgY3Vyc29ycyBhbmQgem9vbSBpY29uKVxyXG4gKiAtIEFkZHMgdG9nZ2xlRGVza3RvcFpvb20gZnVuY3Rpb24uXHJcbiAqIFxyXG4gKi9cclxuXHJcbnZhciBfd2hlZWxEZWx0YTtcclxuXHRcclxuX3JlZ2lzdGVyTW9kdWxlKCdEZXNrdG9wWm9vbScsIHtcclxuXHJcblx0cHVibGljTWV0aG9kczoge1xyXG5cclxuXHRcdGluaXREZXNrdG9wWm9vbTogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRpZihfb2xkSUUpIHtcclxuXHRcdFx0XHQvLyBubyB6b29tIGZvciBvbGQgSUUgKDw9OClcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmKF9saWtlbHlUb3VjaERldmljZSkge1xyXG5cdFx0XHRcdC8vIGlmIGRldGVjdGVkIGhhcmR3YXJlIHRvdWNoIHN1cHBvcnQsIHdlIHdhaXQgdW50aWwgbW91c2UgaXMgdXNlZCxcclxuXHRcdFx0XHQvLyBhbmQgb25seSB0aGVuIGFwcGx5IGRlc2t0b3Atem9vbSBmZWF0dXJlc1xyXG5cdFx0XHRcdF9saXN0ZW4oJ21vdXNlVXNlZCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0c2VsZi5zZXR1cERlc2t0b3Bab29tKCk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0c2VsZi5zZXR1cERlc2t0b3Bab29tKHRydWUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSxcclxuXHJcblx0XHRzZXR1cERlc2t0b3Bab29tOiBmdW5jdGlvbihvbkluaXQpIHtcclxuXHJcblx0XHRcdF93aGVlbERlbHRhID0ge307XHJcblxyXG5cdFx0XHR2YXIgZXZlbnRzID0gJ3doZWVsIG1vdXNld2hlZWwgRE9NTW91c2VTY3JvbGwnO1xyXG5cdFx0XHRcclxuXHRcdFx0X2xpc3RlbignYmluZEV2ZW50cycsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGZyYW1ld29yay5iaW5kKHRlbXBsYXRlLCBldmVudHMsICBzZWxmLmhhbmRsZU1vdXNlV2hlZWwpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdF9saXN0ZW4oJ3VuYmluZEV2ZW50cycsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmKF93aGVlbERlbHRhKSB7XHJcblx0XHRcdFx0XHRmcmFtZXdvcmsudW5iaW5kKHRlbXBsYXRlLCBldmVudHMsIHNlbGYuaGFuZGxlTW91c2VXaGVlbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHNlbGYubW91c2Vab29tZWRJbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0dmFyIGhhc0RyYWdnaW5nQ2xhc3MsXHJcblx0XHRcdFx0dXBkYXRlWm9vbWFibGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGlmKHNlbGYubW91c2Vab29tZWRJbikge1xyXG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsucmVtb3ZlQ2xhc3ModGVtcGxhdGUsICdwc3dwLS16b29tZWQtaW4nKTtcclxuXHRcdFx0XHRcdFx0c2VsZi5tb3VzZVpvb21lZEluID0gZmFsc2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZihfY3Vyclpvb21MZXZlbCA8IDEpIHtcclxuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrLmFkZENsYXNzKHRlbXBsYXRlLCAncHN3cC0tem9vbS1hbGxvd2VkJyk7XHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsucmVtb3ZlQ2xhc3ModGVtcGxhdGUsICdwc3dwLS16b29tLWFsbG93ZWQnKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJlbW92ZURyYWdnaW5nQ2xhc3MoKTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHJlbW92ZURyYWdnaW5nQ2xhc3MgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGlmKGhhc0RyYWdnaW5nQ2xhc3MpIHtcclxuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKHRlbXBsYXRlLCAncHN3cC0tZHJhZ2dpbmcnKTtcclxuXHRcdFx0XHRcdFx0aGFzRHJhZ2dpbmdDbGFzcyA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0XHRfbGlzdGVuKCdyZXNpemUnICwgdXBkYXRlWm9vbWFibGUpO1xyXG5cdFx0XHRfbGlzdGVuKCdhZnRlckNoYW5nZScgLCB1cGRhdGVab29tYWJsZSk7XHJcblx0XHRcdF9saXN0ZW4oJ3BvaW50ZXJEb3duJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYoc2VsZi5tb3VzZVpvb21lZEluKSB7XHJcblx0XHRcdFx0XHRoYXNEcmFnZ2luZ0NsYXNzID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWRyYWdnaW5nJyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0X2xpc3RlbigncG9pbnRlclVwJywgcmVtb3ZlRHJhZ2dpbmdDbGFzcyk7XHJcblxyXG5cdFx0XHRpZighb25Jbml0KSB7XHJcblx0XHRcdFx0dXBkYXRlWm9vbWFibGUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0sXHJcblxyXG5cdFx0aGFuZGxlTW91c2VXaGVlbDogZnVuY3Rpb24oZSkge1xyXG5cclxuXHRcdFx0aWYoX2N1cnJab29tTGV2ZWwgPD0gc2VsZi5jdXJySXRlbS5maXRSYXRpbykge1xyXG5cdFx0XHRcdGlmKCBfb3B0aW9ucy5tb2RhbCApIHtcclxuXHJcblx0XHRcdFx0XHRpZiAoIV9vcHRpb25zLmNsb3NlT25TY3JvbGwgfHwgX251bUFuaW1hdGlvbnMgfHwgX2lzRHJhZ2dpbmcpIHtcclxuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmKF90cmFuc2Zvcm1LZXkgJiYgTWF0aC5hYnMoZS5kZWx0YVkpID4gMikge1xyXG5cdFx0XHRcdFx0XHQvLyBjbG9zZSBQaG90b1N3aXBlXHJcblx0XHRcdFx0XHRcdC8vIGlmIGJyb3dzZXIgc3VwcG9ydHMgdHJhbnNmb3JtcyAmIHNjcm9sbCBjaGFuZ2VkIGVub3VnaFxyXG5cdFx0XHRcdFx0XHRfY2xvc2VkQnlTY3JvbGwgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRzZWxmLmNsb3NlKCk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gYWxsb3cganVzdCBvbmUgZXZlbnQgdG8gZmlyZVxyXG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuXHRcdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvRXZlbnRzL3doZWVsXHJcblx0XHRcdF93aGVlbERlbHRhLnggPSAwO1xyXG5cclxuXHRcdFx0aWYoJ2RlbHRhWCcgaW4gZSkge1xyXG5cdFx0XHRcdGlmKGUuZGVsdGFNb2RlID09PSAxIC8qIERPTV9ERUxUQV9MSU5FICovKSB7XHJcblx0XHRcdFx0XHQvLyAxOCAtIGF2ZXJhZ2UgbGluZSBoZWlnaHRcclxuXHRcdFx0XHRcdF93aGVlbERlbHRhLnggPSBlLmRlbHRhWCAqIDE4O1xyXG5cdFx0XHRcdFx0X3doZWVsRGVsdGEueSA9IGUuZGVsdGFZICogMTg7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdF93aGVlbERlbHRhLnggPSBlLmRlbHRhWDtcclxuXHRcdFx0XHRcdF93aGVlbERlbHRhLnkgPSBlLmRlbHRhWTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZignd2hlZWxEZWx0YScgaW4gZSkge1xyXG5cdFx0XHRcdGlmKGUud2hlZWxEZWx0YVgpIHtcclxuXHRcdFx0XHRcdF93aGVlbERlbHRhLnggPSAtMC4xNiAqIGUud2hlZWxEZWx0YVg7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmKGUud2hlZWxEZWx0YVkpIHtcclxuXHRcdFx0XHRcdF93aGVlbERlbHRhLnkgPSAtMC4xNiAqIGUud2hlZWxEZWx0YVk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdF93aGVlbERlbHRhLnkgPSAtMC4xNiAqIGUud2hlZWxEZWx0YTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZignZGV0YWlsJyBpbiBlKSB7XHJcblx0XHRcdFx0X3doZWVsRGVsdGEueSA9IGUuZGV0YWlsO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0X2NhbGN1bGF0ZVBhbkJvdW5kcyhfY3Vyclpvb21MZXZlbCwgdHJ1ZSk7XHJcblxyXG5cdFx0XHR2YXIgbmV3UGFuWCA9IF9wYW5PZmZzZXQueCAtIF93aGVlbERlbHRhLngsXHJcblx0XHRcdFx0bmV3UGFuWSA9IF9wYW5PZmZzZXQueSAtIF93aGVlbERlbHRhLnk7XHJcblxyXG5cdFx0XHQvLyBvbmx5IHByZXZlbnQgc2Nyb2xsaW5nIGluIG5vbm1vZGFsIG1vZGUgd2hlbiBub3QgYXQgZWRnZXNcclxuXHRcdFx0aWYgKF9vcHRpb25zLm1vZGFsIHx8XHJcblx0XHRcdFx0KFxyXG5cdFx0XHRcdG5ld1BhblggPD0gX2N1cnJQYW5Cb3VuZHMubWluLnggJiYgbmV3UGFuWCA+PSBfY3VyclBhbkJvdW5kcy5tYXgueCAmJlxyXG5cdFx0XHRcdG5ld1BhblkgPD0gX2N1cnJQYW5Cb3VuZHMubWluLnkgJiYgbmV3UGFuWSA+PSBfY3VyclBhbkJvdW5kcy5tYXgueVxyXG5cdFx0XHRcdCkgKSB7XHJcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBUT0RPOiB1c2UgckFGIGluc3RlYWQgb2YgbW91c2V3aGVlbD9cclxuXHRcdFx0c2VsZi5wYW5UbyhuZXdQYW5YLCBuZXdQYW5ZKTtcclxuXHRcdH0sXHJcblxyXG5cdFx0dG9nZ2xlRGVza3RvcFpvb206IGZ1bmN0aW9uKGNlbnRlclBvaW50KSB7XHJcblx0XHRcdGNlbnRlclBvaW50ID0gY2VudGVyUG9pbnQgfHwge3g6X3ZpZXdwb3J0U2l6ZS54LzIgKyBfb2Zmc2V0LngsIHk6X3ZpZXdwb3J0U2l6ZS55LzIgKyBfb2Zmc2V0LnkgfTtcclxuXHJcblx0XHRcdHZhciBkb3VibGVUYXBab29tTGV2ZWwgPSBfb3B0aW9ucy5nZXREb3VibGVUYXBab29tKHRydWUsIHNlbGYuY3Vyckl0ZW0pO1xyXG5cdFx0XHR2YXIgem9vbU91dCA9IF9jdXJyWm9vbUxldmVsID09PSBkb3VibGVUYXBab29tTGV2ZWw7XHJcblx0XHRcdFxyXG5cdFx0XHRzZWxmLm1vdXNlWm9vbWVkSW4gPSAhem9vbU91dDtcclxuXHJcblx0XHRcdHNlbGYuem9vbVRvKHpvb21PdXQgPyBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgOiBkb3VibGVUYXBab29tTGV2ZWwsIGNlbnRlclBvaW50LCAzMzMpO1xyXG5cdFx0XHRmcmFtZXdvcmtbICghem9vbU91dCA/ICdhZGQnIDogJ3JlbW92ZScpICsgJ0NsYXNzJ10odGVtcGxhdGUsICdwc3dwLS16b29tZWQtaW4nKTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG4vKj4+ZGVza3RvcC16b29tKi9cclxuXHJcbi8qPj5oaXN0b3J5Ki9cclxuLyoqXHJcbiAqXHJcbiAqIGhpc3RvcnkuanM6XHJcbiAqXHJcbiAqIC0gQmFjayBidXR0b24gdG8gY2xvc2UgZ2FsbGVyeS5cclxuICogXHJcbiAqIC0gVW5pcXVlIFVSTCBmb3IgZWFjaCBzbGlkZTogZXhhbXBsZS5jb20vJnBpZD0xJmdpZD0zXHJcbiAqICAgKHdoZXJlIFBJRCBpcyBwaWN0dXJlIGluZGV4LCBhbmQgR0lEIGFuZCBnYWxsZXJ5IGluZGV4KVxyXG4gKiAgIFxyXG4gKiAtIFN3aXRjaCBVUkwgd2hlbiBzbGlkZXMgY2hhbmdlLlxyXG4gKiBcclxuICovXHJcblxyXG5cclxudmFyIF9oaXN0b3J5RGVmYXVsdE9wdGlvbnMgPSB7XHJcblx0aGlzdG9yeTogdHJ1ZSxcclxuXHRnYWxsZXJ5VUlEOiAxXHJcbn07XHJcblxyXG52YXIgX2hpc3RvcnlVcGRhdGVUaW1lb3V0LFxyXG5cdF9oYXNoQ2hhbmdlVGltZW91dCxcclxuXHRfaGFzaEFuaW1DaGVja1RpbWVvdXQsXHJcblx0X2hhc2hDaGFuZ2VkQnlTY3JpcHQsXHJcblx0X2hhc2hDaGFuZ2VkQnlIaXN0b3J5LFxyXG5cdF9oYXNoUmVzZXRlZCxcclxuXHRfaW5pdGlhbEhhc2gsXHJcblx0X2hpc3RvcnlDaGFuZ2VkLFxyXG5cdF9jbG9zZWRGcm9tVVJMLFxyXG5cdF91cmxDaGFuZ2VkT25jZSxcclxuXHRfd2luZG93TG9jLFxyXG5cclxuXHRfc3VwcG9ydHNQdXNoU3RhdGUsXHJcblxyXG5cdF9nZXRIYXNoID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gX3dpbmRvd0xvYy5oYXNoLnN1YnN0cmluZygxKTtcclxuXHR9LFxyXG5cdF9jbGVhbkhpc3RvcnlUaW1lb3V0cyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdGlmKF9oaXN0b3J5VXBkYXRlVGltZW91dCkge1xyXG5cdFx0XHRjbGVhclRpbWVvdXQoX2hpc3RvcnlVcGRhdGVUaW1lb3V0KTtcclxuXHRcdH1cclxuXHJcblx0XHRpZihfaGFzaEFuaW1DaGVja1RpbWVvdXQpIHtcclxuXHRcdFx0Y2xlYXJUaW1lb3V0KF9oYXNoQW5pbUNoZWNrVGltZW91dCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0Ly8gcGlkIC0gUGljdHVyZSBpbmRleFxyXG5cdC8vIGdpZCAtIEdhbGxlcnkgaW5kZXhcclxuXHRfcGFyc2VJdGVtSW5kZXhGcm9tVVJMID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgaGFzaCA9IF9nZXRIYXNoKCksXHJcblx0XHRcdHBhcmFtcyA9IHt9O1xyXG5cclxuXHRcdGlmKGhhc2gubGVuZ3RoIDwgNSkgeyAvLyBwaWQ9MVxyXG5cdFx0XHRyZXR1cm4gcGFyYW1zO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBpLCB2YXJzID0gaGFzaC5zcGxpdCgnJicpO1xyXG5cdFx0Zm9yIChpID0gMDsgaSA8IHZhcnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYoIXZhcnNbaV0pIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgcGFpciA9IHZhcnNbaV0uc3BsaXQoJz0nKTtcdFxyXG5cdFx0XHRpZihwYWlyLmxlbmd0aCA8IDIpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRwYXJhbXNbcGFpclswXV0gPSBwYWlyWzFdO1xyXG5cdFx0fVxyXG5cdFx0aWYoX29wdGlvbnMuZ2FsbGVyeVBJRHMpIHtcclxuXHRcdFx0Ly8gZGV0ZWN0IGN1c3RvbSBwaWQgaW4gaGFzaCBhbmQgc2VhcmNoIGZvciBpdCBhbW9uZyB0aGUgaXRlbXMgY29sbGVjdGlvblxyXG5cdFx0XHR2YXIgc2VhcmNoZm9yID0gcGFyYW1zLnBpZDtcclxuXHRcdFx0cGFyYW1zLnBpZCA9IDA7IC8vIGlmIGN1c3RvbSBwaWQgY2Fubm90IGJlIGZvdW5kLCBmYWxsYmFjayB0byB0aGUgZmlyc3QgaXRlbVxyXG5cdFx0XHRmb3IoaSA9IDA7IGkgPCBfaXRlbXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZihfaXRlbXNbaV0ucGlkID09PSBzZWFyY2hmb3IpIHtcclxuXHRcdFx0XHRcdHBhcmFtcy5waWQgPSBpO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRwYXJhbXMucGlkID0gcGFyc2VJbnQocGFyYW1zLnBpZCwxMCktMTtcclxuXHRcdH1cclxuXHRcdGlmKCBwYXJhbXMucGlkIDwgMCApIHtcclxuXHRcdFx0cGFyYW1zLnBpZCA9IDA7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyYW1zO1xyXG5cdH0sXHJcblx0X3VwZGF0ZUhhc2ggPSBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRpZihfaGFzaEFuaW1DaGVja1RpbWVvdXQpIHtcclxuXHRcdFx0Y2xlYXJUaW1lb3V0KF9oYXNoQW5pbUNoZWNrVGltZW91dCk7XHJcblx0XHR9XHJcblxyXG5cclxuXHRcdGlmKF9udW1BbmltYXRpb25zIHx8IF9pc0RyYWdnaW5nKSB7XHJcblx0XHRcdC8vIGNoYW5naW5nIGJyb3dzZXIgVVJMIGZvcmNlcyBsYXlvdXQvcGFpbnQgaW4gc29tZSBicm93c2Vycywgd2hpY2ggY2F1c2VzIG5vdGljYWJsZSBsYWcgZHVyaW5nIGFuaW1hdGlvblxyXG5cdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIHVwZGF0ZSBoYXNoIG9ubHkgd2hlbiBubyBhbmltYXRpb25zIHJ1bm5pbmdcclxuXHRcdFx0X2hhc2hBbmltQ2hlY2tUaW1lb3V0ID0gc2V0VGltZW91dChfdXBkYXRlSGFzaCwgNTAwKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZihfaGFzaENoYW5nZWRCeVNjcmlwdCkge1xyXG5cdFx0XHRjbGVhclRpbWVvdXQoX2hhc2hDaGFuZ2VUaW1lb3V0KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdF9oYXNoQ2hhbmdlZEJ5U2NyaXB0ID0gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0dmFyIHBpZCA9IChfY3VycmVudEl0ZW1JbmRleCArIDEpO1xyXG5cdFx0dmFyIGl0ZW0gPSBfZ2V0SXRlbUF0KCBfY3VycmVudEl0ZW1JbmRleCApO1xyXG5cdFx0aWYoaXRlbS5oYXNPd25Qcm9wZXJ0eSgncGlkJykpIHtcclxuXHRcdFx0Ly8gY2FycnkgZm9yd2FyZCBhbnkgY3VzdG9tIHBpZCBhc3NpZ25lZCB0byB0aGUgaXRlbVxyXG5cdFx0XHRwaWQgPSBpdGVtLnBpZDtcclxuXHRcdH1cclxuXHRcdHZhciBuZXdIYXNoID0gX2luaXRpYWxIYXNoICsgJyYnICArICAnZ2lkPScgKyBfb3B0aW9ucy5nYWxsZXJ5VUlEICsgJyYnICsgJ3BpZD0nICsgcGlkO1xyXG5cclxuXHRcdGlmKCFfaGlzdG9yeUNoYW5nZWQpIHtcclxuXHRcdFx0aWYoX3dpbmRvd0xvYy5oYXNoLmluZGV4T2YobmV3SGFzaCkgPT09IC0xKSB7XHJcblx0XHRcdFx0X3VybENoYW5nZWRPbmNlID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBmaXJzdCB0aW1lIC0gYWRkIG5ldyBoaXNvcnkgcmVjb3JkLCB0aGVuIGp1c3QgcmVwbGFjZVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBuZXdVUkwgPSBfd2luZG93TG9jLmhyZWYuc3BsaXQoJyMnKVswXSArICcjJyArICBuZXdIYXNoO1xyXG5cclxuXHRcdGlmKCBfc3VwcG9ydHNQdXNoU3RhdGUgKSB7XHJcblxyXG5cdFx0XHRpZignIycgKyBuZXdIYXNoICE9PSB3aW5kb3cubG9jYXRpb24uaGFzaCkge1xyXG5cdFx0XHRcdGhpc3RvcnlbX2hpc3RvcnlDaGFuZ2VkID8gJ3JlcGxhY2VTdGF0ZScgOiAncHVzaFN0YXRlJ10oJycsIGRvY3VtZW50LnRpdGxlLCBuZXdVUkwpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYoX2hpc3RvcnlDaGFuZ2VkKSB7XHJcblx0XHRcdFx0X3dpbmRvd0xvYy5yZXBsYWNlKCBuZXdVUkwgKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRfd2luZG93TG9jLmhhc2ggPSBuZXdIYXNoO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdFxyXG5cclxuXHRcdF9oaXN0b3J5Q2hhbmdlZCA9IHRydWU7XHJcblx0XHRfaGFzaENoYW5nZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRfaGFzaENoYW5nZWRCeVNjcmlwdCA9IGZhbHNlO1xyXG5cdFx0fSwgNjApO1xyXG5cdH07XHJcblxyXG5cclxuXHJcblx0XHJcblxyXG5fcmVnaXN0ZXJNb2R1bGUoJ0hpc3RvcnknLCB7XHJcblxyXG5cdFxyXG5cclxuXHRwdWJsaWNNZXRob2RzOiB7XHJcblx0XHRpbml0SGlzdG9yeTogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRmcmFtZXdvcmsuZXh0ZW5kKF9vcHRpb25zLCBfaGlzdG9yeURlZmF1bHRPcHRpb25zLCB0cnVlKTtcclxuXHJcblx0XHRcdGlmKCAhX29wdGlvbnMuaGlzdG9yeSApIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRfd2luZG93TG9jID0gd2luZG93LmxvY2F0aW9uO1xyXG5cdFx0XHRfdXJsQ2hhbmdlZE9uY2UgPSBmYWxzZTtcclxuXHRcdFx0X2Nsb3NlZEZyb21VUkwgPSBmYWxzZTtcclxuXHRcdFx0X2hpc3RvcnlDaGFuZ2VkID0gZmFsc2U7XHJcblx0XHRcdF9pbml0aWFsSGFzaCA9IF9nZXRIYXNoKCk7XHJcblx0XHRcdF9zdXBwb3J0c1B1c2hTdGF0ZSA9ICgncHVzaFN0YXRlJyBpbiBoaXN0b3J5KTtcclxuXHJcblxyXG5cdFx0XHRpZihfaW5pdGlhbEhhc2guaW5kZXhPZignZ2lkPScpID4gLTEpIHtcclxuXHRcdFx0XHRfaW5pdGlhbEhhc2ggPSBfaW5pdGlhbEhhc2guc3BsaXQoJyZnaWQ9JylbMF07XHJcblx0XHRcdFx0X2luaXRpYWxIYXNoID0gX2luaXRpYWxIYXNoLnNwbGl0KCc/Z2lkPScpWzBdO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cclxuXHRcdFx0X2xpc3RlbignYWZ0ZXJDaGFuZ2UnLCBzZWxmLnVwZGF0ZVVSTCk7XHJcblx0XHRcdF9saXN0ZW4oJ3VuYmluZEV2ZW50cycsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCAnaGFzaGNoYW5nZScsIHNlbGYub25IYXNoQ2hhbmdlKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cclxuXHRcdFx0dmFyIHJldHVyblRvT3JpZ2luYWwgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRfaGFzaFJlc2V0ZWQgPSB0cnVlO1xyXG5cdFx0XHRcdGlmKCFfY2xvc2VkRnJvbVVSTCkge1xyXG5cclxuXHRcdFx0XHRcdGlmKF91cmxDaGFuZ2VkT25jZSkge1xyXG5cdFx0XHRcdFx0XHRoaXN0b3J5LmJhY2soKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0XHRpZihfaW5pdGlhbEhhc2gpIHtcclxuXHRcdFx0XHRcdFx0XHRfd2luZG93TG9jLmhhc2ggPSBfaW5pdGlhbEhhc2g7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKF9zdXBwb3J0c1B1c2hTdGF0ZSkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdC8vIHJlbW92ZSBoYXNoIGZyb20gdXJsIHdpdGhvdXQgcmVmcmVzaGluZyBpdCBvciBzY3JvbGxpbmcgdG8gdG9wXHJcblx0XHRcdFx0XHRcdFx0XHRoaXN0b3J5LnB1c2hTdGF0ZSgnJywgZG9jdW1lbnQudGl0bGUsICBfd2luZG93TG9jLnBhdGhuYW1lICsgX3dpbmRvd0xvYy5zZWFyY2ggKTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0X3dpbmRvd0xvYy5oYXNoID0gJyc7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdF9jbGVhbkhpc3RvcnlUaW1lb3V0cygpO1xyXG5cdFx0XHR9O1xyXG5cclxuXHJcblx0XHRcdF9saXN0ZW4oJ3VuYmluZEV2ZW50cycsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmKF9jbG9zZWRCeVNjcm9sbCkge1xyXG5cdFx0XHRcdFx0Ly8gaWYgUGhvdG9Td2lwZSBpcyBjbG9zZWQgYnkgc2Nyb2xsLCB3ZSBnbyBcImJhY2tcIiBiZWZvcmUgdGhlIGNsb3NpbmcgYW5pbWF0aW9uIHN0YXJ0c1xyXG5cdFx0XHRcdFx0Ly8gdGhpcyBpcyBkb25lIHRvIGtlZXAgdGhlIHNjcm9sbCBwb3NpdGlvblxyXG5cdFx0XHRcdFx0cmV0dXJuVG9PcmlnaW5hbCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdF9saXN0ZW4oJ2Rlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZighX2hhc2hSZXNldGVkKSB7XHJcblx0XHRcdFx0XHRyZXR1cm5Ub09yaWdpbmFsKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0X2xpc3RlbignZmlyc3RVcGRhdGUnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRfY3VycmVudEl0ZW1JbmRleCA9IF9wYXJzZUl0ZW1JbmRleEZyb21VUkwoKS5waWQ7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHJcblxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGluZGV4ID0gX2luaXRpYWxIYXNoLmluZGV4T2YoJ3BpZD0nKTtcclxuXHRcdFx0aWYoaW5kZXggPiAtMSkge1xyXG5cdFx0XHRcdF9pbml0aWFsSGFzaCA9IF9pbml0aWFsSGFzaC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xyXG5cdFx0XHRcdGlmKF9pbml0aWFsSGFzaC5zbGljZSgtMSkgPT09ICcmJykge1xyXG5cdFx0XHRcdFx0X2luaXRpYWxIYXNoID0gX2luaXRpYWxIYXNoLnNsaWNlKDAsIC0xKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblxyXG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmKF9pc09wZW4pIHsgLy8gaGFzbid0IGRlc3Ryb3llZCB5ZXRcclxuXHRcdFx0XHRcdGZyYW1ld29yay5iaW5kKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCBzZWxmLm9uSGFzaENoYW5nZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LCA0MCk7XHJcblx0XHRcdFxyXG5cdFx0fSxcclxuXHRcdG9uSGFzaENoYW5nZTogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRpZihfZ2V0SGFzaCgpID09PSBfaW5pdGlhbEhhc2gpIHtcclxuXHJcblx0XHRcdFx0X2Nsb3NlZEZyb21VUkwgPSB0cnVlO1xyXG5cdFx0XHRcdHNlbGYuY2xvc2UoKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0aWYoIV9oYXNoQ2hhbmdlZEJ5U2NyaXB0KSB7XHJcblxyXG5cdFx0XHRcdF9oYXNoQ2hhbmdlZEJ5SGlzdG9yeSA9IHRydWU7XHJcblx0XHRcdFx0c2VsZi5nb1RvKCBfcGFyc2VJdGVtSW5kZXhGcm9tVVJMKCkucGlkICk7XHJcblx0XHRcdFx0X2hhc2hDaGFuZ2VkQnlIaXN0b3J5ID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9LFxyXG5cdFx0dXBkYXRlVVJMOiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdC8vIERlbGF5IHRoZSB1cGRhdGUgb2YgVVJMLCB0byBhdm9pZCBsYWcgZHVyaW5nIHRyYW5zaXRpb24sIFxyXG5cdFx0XHQvLyBhbmQgdG8gbm90IHRvIHRyaWdnZXIgYWN0aW9ucyBsaWtlIFwicmVmcmVzaCBwYWdlIHNvdW5kXCIgb3IgXCJibGlua2luZyBmYXZpY29uXCIgdG8gb2Z0ZW5cclxuXHRcdFx0XHJcblx0XHRcdF9jbGVhbkhpc3RvcnlUaW1lb3V0cygpO1xyXG5cdFx0XHRcclxuXHJcblx0XHRcdGlmKF9oYXNoQ2hhbmdlZEJ5SGlzdG9yeSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYoIV9oaXN0b3J5Q2hhbmdlZCkge1xyXG5cdFx0XHRcdF91cGRhdGVIYXNoKCk7IC8vIGZpcnN0IHRpbWVcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRfaGlzdG9yeVVwZGF0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KF91cGRhdGVIYXNoLCA4MDApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHJcblx0fVxyXG59KTtcclxuXHJcblxyXG4vKj4+aGlzdG9yeSovXHJcblx0ZnJhbWV3b3JrLmV4dGVuZChzZWxmLCBwdWJsaWNNZXRob2RzKTsgfTtcclxuXHRyZXR1cm4gUGhvdG9Td2lwZTtcclxufSk7IiwiLyohXHJcbldheXBvaW50cyAtIDQuMC4wXHJcbkNvcHlyaWdodCDCqSAyMDExLTIwMTUgQ2FsZWIgVHJvdWdodG9uXHJcbkxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuaHR0cHM6Ly9naXRodWIuY29tL2ltYWtld2VidGhpbmdzL3dheXBvaW50cy9ibG9nL21hc3Rlci9saWNlbnNlcy50eHRcclxuKi9cclxuKGZ1bmN0aW9uKCkge1xyXG4gICd1c2Ugc3RyaWN0J1xyXG5cclxuICB2YXIga2V5Q291bnRlciA9IDBcclxuICB2YXIgYWxsV2F5cG9pbnRzID0ge31cclxuXHJcbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL3dheXBvaW50ICovXHJcbiAgZnVuY3Rpb24gV2F5cG9pbnQob3B0aW9ucykge1xyXG4gICAgaWYgKCFvcHRpb25zKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gb3B0aW9ucyBwYXNzZWQgdG8gV2F5cG9pbnQgY29uc3RydWN0b3InKVxyXG4gICAgfVxyXG4gICAgaWYgKCFvcHRpb25zLmVsZW1lbnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50IG9wdGlvbiBwYXNzZWQgdG8gV2F5cG9pbnQgY29uc3RydWN0b3InKVxyXG4gICAgfVxyXG4gICAgaWYgKCFvcHRpb25zLmhhbmRsZXIpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBoYW5kbGVyIG9wdGlvbiBwYXNzZWQgdG8gV2F5cG9pbnQgY29uc3RydWN0b3InKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMua2V5ID0gJ3dheXBvaW50LScgKyBrZXlDb3VudGVyXHJcbiAgICB0aGlzLm9wdGlvbnMgPSBXYXlwb2ludC5BZGFwdGVyLmV4dGVuZCh7fSwgV2F5cG9pbnQuZGVmYXVsdHMsIG9wdGlvbnMpXHJcbiAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLm9wdGlvbnMuZWxlbWVudFxyXG4gICAgdGhpcy5hZGFwdGVyID0gbmV3IFdheXBvaW50LkFkYXB0ZXIodGhpcy5lbGVtZW50KVxyXG4gICAgdGhpcy5jYWxsYmFjayA9IG9wdGlvbnMuaGFuZGxlclxyXG4gICAgdGhpcy5heGlzID0gdGhpcy5vcHRpb25zLmhvcml6b250YWwgPyAnaG9yaXpvbnRhbCcgOiAndmVydGljYWwnXHJcbiAgICB0aGlzLmVuYWJsZWQgPSB0aGlzLm9wdGlvbnMuZW5hYmxlZFxyXG4gICAgdGhpcy50cmlnZ2VyUG9pbnQgPSBudWxsXHJcbiAgICB0aGlzLmdyb3VwID0gV2F5cG9pbnQuR3JvdXAuZmluZE9yQ3JlYXRlKHtcclxuICAgICAgbmFtZTogdGhpcy5vcHRpb25zLmdyb3VwLFxyXG4gICAgICBheGlzOiB0aGlzLmF4aXNcclxuICAgIH0pXHJcbiAgICB0aGlzLmNvbnRleHQgPSBXYXlwb2ludC5Db250ZXh0LmZpbmRPckNyZWF0ZUJ5RWxlbWVudCh0aGlzLm9wdGlvbnMuY29udGV4dClcclxuXHJcbiAgICBpZiAoV2F5cG9pbnQub2Zmc2V0QWxpYXNlc1t0aGlzLm9wdGlvbnMub2Zmc2V0XSkge1xyXG4gICAgICB0aGlzLm9wdGlvbnMub2Zmc2V0ID0gV2F5cG9pbnQub2Zmc2V0QWxpYXNlc1t0aGlzLm9wdGlvbnMub2Zmc2V0XVxyXG4gICAgfVxyXG4gICAgdGhpcy5ncm91cC5hZGQodGhpcylcclxuICAgIHRoaXMuY29udGV4dC5hZGQodGhpcylcclxuICAgIGFsbFdheXBvaW50c1t0aGlzLmtleV0gPSB0aGlzXHJcbiAgICBrZXlDb3VudGVyICs9IDFcclxuICB9XHJcblxyXG4gIC8qIFByaXZhdGUgKi9cclxuICBXYXlwb2ludC5wcm90b3R5cGUucXVldWVUcmlnZ2VyID0gZnVuY3Rpb24oZGlyZWN0aW9uKSB7XHJcbiAgICB0aGlzLmdyb3VwLnF1ZXVlVHJpZ2dlcih0aGlzLCBkaXJlY3Rpb24pXHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgV2F5cG9pbnQucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbihhcmdzKSB7XHJcbiAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmNhbGxiYWNrKSB7XHJcbiAgICAgIHRoaXMuY2FsbGJhY2suYXBwbHkodGhpcywgYXJncylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qIFB1YmxpYyAqL1xyXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9kZXN0cm95ICovXHJcbiAgV2F5cG9pbnQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY29udGV4dC5yZW1vdmUodGhpcylcclxuICAgIHRoaXMuZ3JvdXAucmVtb3ZlKHRoaXMpXHJcbiAgICBkZWxldGUgYWxsV2F5cG9pbnRzW3RoaXMua2V5XVxyXG4gIH1cclxuXHJcbiAgLyogUHVibGljICovXHJcbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2Rpc2FibGUgKi9cclxuICBXYXlwb2ludC5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2VcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvKiBQdWJsaWMgKi9cclxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvZW5hYmxlICovXHJcbiAgV2F5cG9pbnQucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb250ZXh0LnJlZnJlc2goKVxyXG4gICAgdGhpcy5lbmFibGVkID0gdHJ1ZVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8qIFB1YmxpYyAqL1xyXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9uZXh0ICovXHJcbiAgV2F5cG9pbnQucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLmdyb3VwLm5leHQodGhpcylcclxuICB9XHJcblxyXG4gIC8qIFB1YmxpYyAqL1xyXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9wcmV2aW91cyAqL1xyXG4gIFdheXBvaW50LnByb3RvdHlwZS5wcmV2aW91cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ3JvdXAucHJldmlvdXModGhpcylcclxuICB9XHJcblxyXG4gIC8qIFByaXZhdGUgKi9cclxuICBXYXlwb2ludC5pbnZva2VBbGwgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgIHZhciBhbGxXYXlwb2ludHNBcnJheSA9IFtdXHJcbiAgICBmb3IgKHZhciB3YXlwb2ludEtleSBpbiBhbGxXYXlwb2ludHMpIHtcclxuICAgICAgYWxsV2F5cG9pbnRzQXJyYXkucHVzaChhbGxXYXlwb2ludHNbd2F5cG9pbnRLZXldKVxyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGVuZCA9IGFsbFdheXBvaW50c0FycmF5Lmxlbmd0aDsgaSA8IGVuZDsgaSsrKSB7XHJcbiAgICAgIGFsbFdheXBvaW50c0FycmF5W2ldW21ldGhvZF0oKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyogUHVibGljICovXHJcbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2Rlc3Ryb3ktYWxsICovXHJcbiAgV2F5cG9pbnQuZGVzdHJveUFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgV2F5cG9pbnQuaW52b2tlQWxsKCdkZXN0cm95JylcclxuICB9XHJcblxyXG4gIC8qIFB1YmxpYyAqL1xyXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9kaXNhYmxlLWFsbCAqL1xyXG4gIFdheXBvaW50LmRpc2FibGVBbGwgPSBmdW5jdGlvbigpIHtcclxuICAgIFdheXBvaW50Lmludm9rZUFsbCgnZGlzYWJsZScpXHJcbiAgfVxyXG5cclxuICAvKiBQdWJsaWMgKi9cclxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvZW5hYmxlLWFsbCAqL1xyXG4gIFdheXBvaW50LmVuYWJsZUFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgV2F5cG9pbnQuaW52b2tlQWxsKCdlbmFibGUnKVxyXG4gIH1cclxuXHJcbiAgLyogUHVibGljICovXHJcbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL3JlZnJlc2gtYWxsICovXHJcbiAgV2F5cG9pbnQucmVmcmVzaEFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgV2F5cG9pbnQuQ29udGV4dC5yZWZyZXNoQWxsKClcclxuICB9XHJcblxyXG4gIC8qIFB1YmxpYyAqL1xyXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS92aWV3cG9ydC1oZWlnaHQgKi9cclxuICBXYXlwb2ludC52aWV3cG9ydEhlaWdodCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XHJcbiAgfVxyXG5cclxuICAvKiBQdWJsaWMgKi9cclxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvdmlld3BvcnQtd2lkdGggKi9cclxuICBXYXlwb2ludC52aWV3cG9ydFdpZHRoID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoXHJcbiAgfVxyXG5cclxuICBXYXlwb2ludC5hZGFwdGVycyA9IFtdXHJcblxyXG4gIFdheXBvaW50LmRlZmF1bHRzID0ge1xyXG4gICAgY29udGV4dDogd2luZG93LFxyXG4gICAgY29udGludW91czogdHJ1ZSxcclxuICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICBncm91cDogJ2RlZmF1bHQnLFxyXG4gICAgaG9yaXpvbnRhbDogZmFsc2UsXHJcbiAgICBvZmZzZXQ6IDBcclxuICB9XHJcblxyXG4gIFdheXBvaW50Lm9mZnNldEFsaWFzZXMgPSB7XHJcbiAgICAnYm90dG9tLWluLXZpZXcnOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5pbm5lckhlaWdodCgpIC0gdGhpcy5hZGFwdGVyLm91dGVySGVpZ2h0KClcclxuICAgIH0sXHJcbiAgICAncmlnaHQtaW4tdmlldyc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LmlubmVyV2lkdGgoKSAtIHRoaXMuYWRhcHRlci5vdXRlcldpZHRoKClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHdpbmRvdy5XYXlwb2ludCA9IFdheXBvaW50XHJcbn0oKSlcclxuOyhmdW5jdGlvbigpIHtcclxuICAndXNlIHN0cmljdCdcclxuXHJcbiAgZnVuY3Rpb24gcmVxdWVzdEFuaW1hdGlvbkZyYW1lU2hpbShjYWxsYmFjaykge1xyXG4gICAgd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MClcclxuICB9XHJcblxyXG4gIHZhciBrZXlDb3VudGVyID0gMFxyXG4gIHZhciBjb250ZXh0cyA9IHt9XHJcbiAgdmFyIFdheXBvaW50ID0gd2luZG93LldheXBvaW50XHJcbiAgdmFyIG9sZFdpbmRvd0xvYWQgPSB3aW5kb3cub25sb2FkXHJcblxyXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9jb250ZXh0ICovXHJcbiAgZnVuY3Rpb24gQ29udGV4dChlbGVtZW50KSB7XHJcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50XHJcbiAgICB0aGlzLkFkYXB0ZXIgPSBXYXlwb2ludC5BZGFwdGVyXHJcbiAgICB0aGlzLmFkYXB0ZXIgPSBuZXcgdGhpcy5BZGFwdGVyKGVsZW1lbnQpXHJcbiAgICB0aGlzLmtleSA9ICd3YXlwb2ludC1jb250ZXh0LScgKyBrZXlDb3VudGVyXHJcbiAgICB0aGlzLmRpZFNjcm9sbCA9IGZhbHNlXHJcbiAgICB0aGlzLmRpZFJlc2l6ZSA9IGZhbHNlXHJcbiAgICB0aGlzLm9sZFNjcm9sbCA9IHtcclxuICAgICAgeDogdGhpcy5hZGFwdGVyLnNjcm9sbExlZnQoKSxcclxuICAgICAgeTogdGhpcy5hZGFwdGVyLnNjcm9sbFRvcCgpXHJcbiAgICB9XHJcbiAgICB0aGlzLndheXBvaW50cyA9IHtcclxuICAgICAgdmVydGljYWw6IHt9LFxyXG4gICAgICBob3Jpem9udGFsOiB7fVxyXG4gICAgfVxyXG5cclxuICAgIGVsZW1lbnQud2F5cG9pbnRDb250ZXh0S2V5ID0gdGhpcy5rZXlcclxuICAgIGNvbnRleHRzW2VsZW1lbnQud2F5cG9pbnRDb250ZXh0S2V5XSA9IHRoaXNcclxuICAgIGtleUNvdW50ZXIgKz0gMVxyXG5cclxuICAgIHRoaXMuY3JlYXRlVGhyb3R0bGVkU2Nyb2xsSGFuZGxlcigpXHJcbiAgICB0aGlzLmNyZWF0ZVRocm90dGxlZFJlc2l6ZUhhbmRsZXIoKVxyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIENvbnRleHQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHdheXBvaW50KSB7XHJcbiAgICB2YXIgYXhpcyA9IHdheXBvaW50Lm9wdGlvbnMuaG9yaXpvbnRhbCA/ICdob3Jpem9udGFsJyA6ICd2ZXJ0aWNhbCdcclxuICAgIHRoaXMud2F5cG9pbnRzW2F4aXNdW3dheXBvaW50LmtleV0gPSB3YXlwb2ludFxyXG4gICAgdGhpcy5yZWZyZXNoKClcclxuICB9XHJcblxyXG4gIC8qIFByaXZhdGUgKi9cclxuICBDb250ZXh0LnByb3RvdHlwZS5jaGVja0VtcHR5ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaG9yaXpvbnRhbEVtcHR5ID0gdGhpcy5BZGFwdGVyLmlzRW1wdHlPYmplY3QodGhpcy53YXlwb2ludHMuaG9yaXpvbnRhbClcclxuICAgIHZhciB2ZXJ0aWNhbEVtcHR5ID0gdGhpcy5BZGFwdGVyLmlzRW1wdHlPYmplY3QodGhpcy53YXlwb2ludHMudmVydGljYWwpXHJcbiAgICBpZiAoaG9yaXpvbnRhbEVtcHR5ICYmIHZlcnRpY2FsRW1wdHkpIHtcclxuICAgICAgdGhpcy5hZGFwdGVyLm9mZignLndheXBvaW50cycpXHJcbiAgICAgIGRlbGV0ZSBjb250ZXh0c1t0aGlzLmtleV1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qIFByaXZhdGUgKi9cclxuICBDb250ZXh0LnByb3RvdHlwZS5jcmVhdGVUaHJvdHRsZWRSZXNpemVIYW5kbGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXNcclxuXHJcbiAgICBmdW5jdGlvbiByZXNpemVIYW5kbGVyKCkge1xyXG4gICAgICBzZWxmLmhhbmRsZVJlc2l6ZSgpXHJcbiAgICAgIHNlbGYuZGlkUmVzaXplID0gZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmFkYXB0ZXIub24oJ3Jlc2l6ZS53YXlwb2ludHMnLCBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKCFzZWxmLmRpZFJlc2l6ZSkge1xyXG4gICAgICAgIHNlbGYuZGlkUmVzaXplID0gdHJ1ZVxyXG4gICAgICAgIFdheXBvaW50LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZXNpemVIYW5kbGVyKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIENvbnRleHQucHJvdG90eXBlLmNyZWF0ZVRocm90dGxlZFNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzZWxmID0gdGhpc1xyXG4gICAgZnVuY3Rpb24gc2Nyb2xsSGFuZGxlcigpIHtcclxuICAgICAgc2VsZi5oYW5kbGVTY3JvbGwoKVxyXG4gICAgICBzZWxmLmRpZFNjcm9sbCA9IGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hZGFwdGVyLm9uKCdzY3JvbGwud2F5cG9pbnRzJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICghc2VsZi5kaWRTY3JvbGwgfHwgV2F5cG9pbnQuaXNUb3VjaCkge1xyXG4gICAgICAgIHNlbGYuZGlkU2Nyb2xsID0gdHJ1ZVxyXG4gICAgICAgIFdheXBvaW50LnJlcXVlc3RBbmltYXRpb25GcmFtZShzY3JvbGxIYW5kbGVyKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIENvbnRleHQucHJvdG90eXBlLmhhbmRsZVJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgV2F5cG9pbnQuQ29udGV4dC5yZWZyZXNoQWxsKClcclxuICB9XHJcblxyXG4gIC8qIFByaXZhdGUgKi9cclxuICBDb250ZXh0LnByb3RvdHlwZS5oYW5kbGVTY3JvbGwgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciB0cmlnZ2VyZWRHcm91cHMgPSB7fVxyXG4gICAgdmFyIGF4ZXMgPSB7XHJcbiAgICAgIGhvcml6b250YWw6IHtcclxuICAgICAgICBuZXdTY3JvbGw6IHRoaXMuYWRhcHRlci5zY3JvbGxMZWZ0KCksXHJcbiAgICAgICAgb2xkU2Nyb2xsOiB0aGlzLm9sZFNjcm9sbC54LFxyXG4gICAgICAgIGZvcndhcmQ6ICdyaWdodCcsXHJcbiAgICAgICAgYmFja3dhcmQ6ICdsZWZ0J1xyXG4gICAgICB9LFxyXG4gICAgICB2ZXJ0aWNhbDoge1xyXG4gICAgICAgIG5ld1Njcm9sbDogdGhpcy5hZGFwdGVyLnNjcm9sbFRvcCgpLFxyXG4gICAgICAgIG9sZFNjcm9sbDogdGhpcy5vbGRTY3JvbGwueSxcclxuICAgICAgICBmb3J3YXJkOiAnZG93bicsXHJcbiAgICAgICAgYmFja3dhcmQ6ICd1cCdcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGF4aXNLZXkgaW4gYXhlcykge1xyXG4gICAgICB2YXIgYXhpcyA9IGF4ZXNbYXhpc0tleV1cclxuICAgICAgdmFyIGlzRm9yd2FyZCA9IGF4aXMubmV3U2Nyb2xsID4gYXhpcy5vbGRTY3JvbGxcclxuICAgICAgdmFyIGRpcmVjdGlvbiA9IGlzRm9yd2FyZCA/IGF4aXMuZm9yd2FyZCA6IGF4aXMuYmFja3dhcmRcclxuXHJcbiAgICAgIGZvciAodmFyIHdheXBvaW50S2V5IGluIHRoaXMud2F5cG9pbnRzW2F4aXNLZXldKSB7XHJcbiAgICAgICAgdmFyIHdheXBvaW50ID0gdGhpcy53YXlwb2ludHNbYXhpc0tleV1bd2F5cG9pbnRLZXldXHJcbiAgICAgICAgdmFyIHdhc0JlZm9yZVRyaWdnZXJQb2ludCA9IGF4aXMub2xkU2Nyb2xsIDwgd2F5cG9pbnQudHJpZ2dlclBvaW50XHJcbiAgICAgICAgdmFyIG5vd0FmdGVyVHJpZ2dlclBvaW50ID0gYXhpcy5uZXdTY3JvbGwgPj0gd2F5cG9pbnQudHJpZ2dlclBvaW50XHJcbiAgICAgICAgdmFyIGNyb3NzZWRGb3J3YXJkID0gd2FzQmVmb3JlVHJpZ2dlclBvaW50ICYmIG5vd0FmdGVyVHJpZ2dlclBvaW50XHJcbiAgICAgICAgdmFyIGNyb3NzZWRCYWNrd2FyZCA9ICF3YXNCZWZvcmVUcmlnZ2VyUG9pbnQgJiYgIW5vd0FmdGVyVHJpZ2dlclBvaW50XHJcbiAgICAgICAgaWYgKGNyb3NzZWRGb3J3YXJkIHx8IGNyb3NzZWRCYWNrd2FyZCkge1xyXG4gICAgICAgICAgd2F5cG9pbnQucXVldWVUcmlnZ2VyKGRpcmVjdGlvbilcclxuICAgICAgICAgIHRyaWdnZXJlZEdyb3Vwc1t3YXlwb2ludC5ncm91cC5pZF0gPSB3YXlwb2ludC5ncm91cFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGdyb3VwS2V5IGluIHRyaWdnZXJlZEdyb3Vwcykge1xyXG4gICAgICB0cmlnZ2VyZWRHcm91cHNbZ3JvdXBLZXldLmZsdXNoVHJpZ2dlcnMoKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMub2xkU2Nyb2xsID0ge1xyXG4gICAgICB4OiBheGVzLmhvcml6b250YWwubmV3U2Nyb2xsLFxyXG4gICAgICB5OiBheGVzLnZlcnRpY2FsLm5ld1Njcm9sbFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIENvbnRleHQucHJvdG90eXBlLmlubmVySGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvKmVzbGludC1kaXNhYmxlIGVxZXFlcSAqL1xyXG4gICAgaWYgKHRoaXMuZWxlbWVudCA9PSB0aGlzLmVsZW1lbnQud2luZG93KSB7XHJcbiAgICAgIHJldHVybiBXYXlwb2ludC52aWV3cG9ydEhlaWdodCgpXHJcbiAgICB9XHJcbiAgICAvKmVzbGludC1lbmFibGUgZXFlcWVxICovXHJcbiAgICByZXR1cm4gdGhpcy5hZGFwdGVyLmlubmVySGVpZ2h0KClcclxuICB9XHJcblxyXG4gIC8qIFByaXZhdGUgKi9cclxuICBDb250ZXh0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih3YXlwb2ludCkge1xyXG4gICAgZGVsZXRlIHRoaXMud2F5cG9pbnRzW3dheXBvaW50LmF4aXNdW3dheXBvaW50LmtleV1cclxuICAgIHRoaXMuY2hlY2tFbXB0eSgpXHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgQ29udGV4dC5wcm90b3R5cGUuaW5uZXJXaWR0aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLyplc2xpbnQtZGlzYWJsZSBlcWVxZXEgKi9cclxuICAgIGlmICh0aGlzLmVsZW1lbnQgPT0gdGhpcy5lbGVtZW50LndpbmRvdykge1xyXG4gICAgICByZXR1cm4gV2F5cG9pbnQudmlld3BvcnRXaWR0aCgpXHJcbiAgICB9XHJcbiAgICAvKmVzbGludC1lbmFibGUgZXFlcWVxICovXHJcbiAgICByZXR1cm4gdGhpcy5hZGFwdGVyLmlubmVyV2lkdGgoKVxyXG4gIH1cclxuXHJcbiAgLyogUHVibGljICovXHJcbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2NvbnRleHQtZGVzdHJveSAqL1xyXG4gIENvbnRleHQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhbGxXYXlwb2ludHMgPSBbXVxyXG4gICAgZm9yICh2YXIgYXhpcyBpbiB0aGlzLndheXBvaW50cykge1xyXG4gICAgICBmb3IgKHZhciB3YXlwb2ludEtleSBpbiB0aGlzLndheXBvaW50c1theGlzXSkge1xyXG4gICAgICAgIGFsbFdheXBvaW50cy5wdXNoKHRoaXMud2F5cG9pbnRzW2F4aXNdW3dheXBvaW50S2V5XSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGVuZCA9IGFsbFdheXBvaW50cy5sZW5ndGg7IGkgPCBlbmQ7IGkrKykge1xyXG4gICAgICBhbGxXYXlwb2ludHNbaV0uZGVzdHJveSgpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiBQdWJsaWMgKi9cclxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvY29udGV4dC1yZWZyZXNoICovXHJcbiAgQ29udGV4dC5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLyplc2xpbnQtZGlzYWJsZSBlcWVxZXEgKi9cclxuICAgIHZhciBpc1dpbmRvdyA9IHRoaXMuZWxlbWVudCA9PSB0aGlzLmVsZW1lbnQud2luZG93XHJcbiAgICAvKmVzbGludC1lbmFibGUgZXFlcWVxICovXHJcbiAgICB2YXIgY29udGV4dE9mZnNldCA9IGlzV2luZG93ID8gdW5kZWZpbmVkIDogdGhpcy5hZGFwdGVyLm9mZnNldCgpXHJcbiAgICB2YXIgdHJpZ2dlcmVkR3JvdXBzID0ge31cclxuICAgIHZhciBheGVzXHJcblxyXG4gICAgdGhpcy5oYW5kbGVTY3JvbGwoKVxyXG4gICAgYXhlcyA9IHtcclxuICAgICAgaG9yaXpvbnRhbDoge1xyXG4gICAgICAgIGNvbnRleHRPZmZzZXQ6IGlzV2luZG93ID8gMCA6IGNvbnRleHRPZmZzZXQubGVmdCxcclxuICAgICAgICBjb250ZXh0U2Nyb2xsOiBpc1dpbmRvdyA/IDAgOiB0aGlzLm9sZFNjcm9sbC54LFxyXG4gICAgICAgIGNvbnRleHREaW1lbnNpb246IHRoaXMuaW5uZXJXaWR0aCgpLFxyXG4gICAgICAgIG9sZFNjcm9sbDogdGhpcy5vbGRTY3JvbGwueCxcclxuICAgICAgICBmb3J3YXJkOiAncmlnaHQnLFxyXG4gICAgICAgIGJhY2t3YXJkOiAnbGVmdCcsXHJcbiAgICAgICAgb2Zmc2V0UHJvcDogJ2xlZnQnXHJcbiAgICAgIH0sXHJcbiAgICAgIHZlcnRpY2FsOiB7XHJcbiAgICAgICAgY29udGV4dE9mZnNldDogaXNXaW5kb3cgPyAwIDogY29udGV4dE9mZnNldC50b3AsXHJcbiAgICAgICAgY29udGV4dFNjcm9sbDogaXNXaW5kb3cgPyAwIDogdGhpcy5vbGRTY3JvbGwueSxcclxuICAgICAgICBjb250ZXh0RGltZW5zaW9uOiB0aGlzLmlubmVySGVpZ2h0KCksXHJcbiAgICAgICAgb2xkU2Nyb2xsOiB0aGlzLm9sZFNjcm9sbC55LFxyXG4gICAgICAgIGZvcndhcmQ6ICdkb3duJyxcclxuICAgICAgICBiYWNrd2FyZDogJ3VwJyxcclxuICAgICAgICBvZmZzZXRQcm9wOiAndG9wJ1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgYXhpc0tleSBpbiBheGVzKSB7XHJcbiAgICAgIHZhciBheGlzID0gYXhlc1theGlzS2V5XVxyXG4gICAgICBmb3IgKHZhciB3YXlwb2ludEtleSBpbiB0aGlzLndheXBvaW50c1theGlzS2V5XSkge1xyXG4gICAgICAgIHZhciB3YXlwb2ludCA9IHRoaXMud2F5cG9pbnRzW2F4aXNLZXldW3dheXBvaW50S2V5XVxyXG4gICAgICAgIHZhciBhZGp1c3RtZW50ID0gd2F5cG9pbnQub3B0aW9ucy5vZmZzZXRcclxuICAgICAgICB2YXIgb2xkVHJpZ2dlclBvaW50ID0gd2F5cG9pbnQudHJpZ2dlclBvaW50XHJcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAwXHJcbiAgICAgICAgdmFyIGZyZXNoV2F5cG9pbnQgPSBvbGRUcmlnZ2VyUG9pbnQgPT0gbnVsbFxyXG4gICAgICAgIHZhciBjb250ZXh0TW9kaWZpZXIsIHdhc0JlZm9yZVNjcm9sbCwgbm93QWZ0ZXJTY3JvbGxcclxuICAgICAgICB2YXIgdHJpZ2dlcmVkQmFja3dhcmQsIHRyaWdnZXJlZEZvcndhcmRcclxuXHJcbiAgICAgICAgaWYgKHdheXBvaW50LmVsZW1lbnQgIT09IHdheXBvaW50LmVsZW1lbnQud2luZG93KSB7XHJcbiAgICAgICAgICBlbGVtZW50T2Zmc2V0ID0gd2F5cG9pbnQuYWRhcHRlci5vZmZzZXQoKVtheGlzLm9mZnNldFByb3BdXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGFkanVzdG1lbnQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIGFkanVzdG1lbnQgPSBhZGp1c3RtZW50LmFwcGx5KHdheXBvaW50KVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgYWRqdXN0bWVudCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgIGFkanVzdG1lbnQgPSBwYXJzZUZsb2F0KGFkanVzdG1lbnQpXHJcbiAgICAgICAgICBpZiAod2F5cG9pbnQub3B0aW9ucy5vZmZzZXQuaW5kZXhPZignJScpID4gLSAxKSB7XHJcbiAgICAgICAgICAgIGFkanVzdG1lbnQgPSBNYXRoLmNlaWwoYXhpcy5jb250ZXh0RGltZW5zaW9uICogYWRqdXN0bWVudCAvIDEwMClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnRleHRNb2RpZmllciA9IGF4aXMuY29udGV4dFNjcm9sbCAtIGF4aXMuY29udGV4dE9mZnNldFxyXG4gICAgICAgIHdheXBvaW50LnRyaWdnZXJQb2ludCA9IGVsZW1lbnRPZmZzZXQgKyBjb250ZXh0TW9kaWZpZXIgLSBhZGp1c3RtZW50XHJcbiAgICAgICAgd2FzQmVmb3JlU2Nyb2xsID0gb2xkVHJpZ2dlclBvaW50IDwgYXhpcy5vbGRTY3JvbGxcclxuICAgICAgICBub3dBZnRlclNjcm9sbCA9IHdheXBvaW50LnRyaWdnZXJQb2ludCA+PSBheGlzLm9sZFNjcm9sbFxyXG4gICAgICAgIHRyaWdnZXJlZEJhY2t3YXJkID0gd2FzQmVmb3JlU2Nyb2xsICYmIG5vd0FmdGVyU2Nyb2xsXHJcbiAgICAgICAgdHJpZ2dlcmVkRm9yd2FyZCA9ICF3YXNCZWZvcmVTY3JvbGwgJiYgIW5vd0FmdGVyU2Nyb2xsXHJcblxyXG4gICAgICAgIGlmICghZnJlc2hXYXlwb2ludCAmJiB0cmlnZ2VyZWRCYWNrd2FyZCkge1xyXG4gICAgICAgICAgd2F5cG9pbnQucXVldWVUcmlnZ2VyKGF4aXMuYmFja3dhcmQpXHJcbiAgICAgICAgICB0cmlnZ2VyZWRHcm91cHNbd2F5cG9pbnQuZ3JvdXAuaWRdID0gd2F5cG9pbnQuZ3JvdXBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIWZyZXNoV2F5cG9pbnQgJiYgdHJpZ2dlcmVkRm9yd2FyZCkge1xyXG4gICAgICAgICAgd2F5cG9pbnQucXVldWVUcmlnZ2VyKGF4aXMuZm9yd2FyZClcclxuICAgICAgICAgIHRyaWdnZXJlZEdyb3Vwc1t3YXlwb2ludC5ncm91cC5pZF0gPSB3YXlwb2ludC5ncm91cFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChmcmVzaFdheXBvaW50ICYmIGF4aXMub2xkU2Nyb2xsID49IHdheXBvaW50LnRyaWdnZXJQb2ludCkge1xyXG4gICAgICAgICAgd2F5cG9pbnQucXVldWVUcmlnZ2VyKGF4aXMuZm9yd2FyZClcclxuICAgICAgICAgIHRyaWdnZXJlZEdyb3Vwc1t3YXlwb2ludC5ncm91cC5pZF0gPSB3YXlwb2ludC5ncm91cFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIFdheXBvaW50LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcclxuICAgICAgZm9yICh2YXIgZ3JvdXBLZXkgaW4gdHJpZ2dlcmVkR3JvdXBzKSB7XHJcbiAgICAgICAgdHJpZ2dlcmVkR3JvdXBzW2dyb3VwS2V5XS5mbHVzaFRyaWdnZXJzKClcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIENvbnRleHQuZmluZE9yQ3JlYXRlQnlFbGVtZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgcmV0dXJuIENvbnRleHQuZmluZEJ5RWxlbWVudChlbGVtZW50KSB8fCBuZXcgQ29udGV4dChlbGVtZW50KVxyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIENvbnRleHQucmVmcmVzaEFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZm9yICh2YXIgY29udGV4dElkIGluIGNvbnRleHRzKSB7XHJcbiAgICAgIGNvbnRleHRzW2NvbnRleHRJZF0ucmVmcmVzaCgpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiBQdWJsaWMgKi9cclxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvY29udGV4dC1maW5kLWJ5LWVsZW1lbnQgKi9cclxuICBDb250ZXh0LmZpbmRCeUVsZW1lbnQgPSBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICByZXR1cm4gY29udGV4dHNbZWxlbWVudC53YXlwb2ludENvbnRleHRLZXldXHJcbiAgfVxyXG5cclxuICB3aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAob2xkV2luZG93TG9hZCkge1xyXG4gICAgICBvbGRXaW5kb3dMb2FkKClcclxuICAgIH1cclxuICAgIENvbnRleHQucmVmcmVzaEFsbCgpXHJcbiAgfVxyXG5cclxuICBXYXlwb2ludC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgdmFyIHJlcXVlc3RGbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZVNoaW1cclxuICAgIHJlcXVlc3RGbi5jYWxsKHdpbmRvdywgY2FsbGJhY2spXHJcbiAgfVxyXG4gIFdheXBvaW50LkNvbnRleHQgPSBDb250ZXh0XHJcbn0oKSlcclxuOyhmdW5jdGlvbigpIHtcclxuICAndXNlIHN0cmljdCdcclxuXHJcbiAgZnVuY3Rpb24gYnlUcmlnZ2VyUG9pbnQoYSwgYikge1xyXG4gICAgcmV0dXJuIGEudHJpZ2dlclBvaW50IC0gYi50cmlnZ2VyUG9pbnRcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGJ5UmV2ZXJzZVRyaWdnZXJQb2ludChhLCBiKSB7XHJcbiAgICByZXR1cm4gYi50cmlnZ2VyUG9pbnQgLSBhLnRyaWdnZXJQb2ludFxyXG4gIH1cclxuXHJcbiAgdmFyIGdyb3VwcyA9IHtcclxuICAgIHZlcnRpY2FsOiB7fSxcclxuICAgIGhvcml6b250YWw6IHt9XHJcbiAgfVxyXG4gIHZhciBXYXlwb2ludCA9IHdpbmRvdy5XYXlwb2ludFxyXG5cclxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvZ3JvdXAgKi9cclxuICBmdW5jdGlvbiBHcm91cChvcHRpb25zKSB7XHJcbiAgICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWVcclxuICAgIHRoaXMuYXhpcyA9IG9wdGlvbnMuYXhpc1xyXG4gICAgdGhpcy5pZCA9IHRoaXMubmFtZSArICctJyArIHRoaXMuYXhpc1xyXG4gICAgdGhpcy53YXlwb2ludHMgPSBbXVxyXG4gICAgdGhpcy5jbGVhclRyaWdnZXJRdWV1ZXMoKVxyXG4gICAgZ3JvdXBzW3RoaXMuYXhpc11bdGhpcy5uYW1lXSA9IHRoaXNcclxuICB9XHJcblxyXG4gIC8qIFByaXZhdGUgKi9cclxuICBHcm91cC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24od2F5cG9pbnQpIHtcclxuICAgIHRoaXMud2F5cG9pbnRzLnB1c2god2F5cG9pbnQpXHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgR3JvdXAucHJvdG90eXBlLmNsZWFyVHJpZ2dlclF1ZXVlcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy50cmlnZ2VyUXVldWVzID0ge1xyXG4gICAgICB1cDogW10sXHJcbiAgICAgIGRvd246IFtdLFxyXG4gICAgICBsZWZ0OiBbXSxcclxuICAgICAgcmlnaHQ6IFtdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgR3JvdXAucHJvdG90eXBlLmZsdXNoVHJpZ2dlcnMgPSBmdW5jdGlvbigpIHtcclxuICAgIGZvciAodmFyIGRpcmVjdGlvbiBpbiB0aGlzLnRyaWdnZXJRdWV1ZXMpIHtcclxuICAgICAgdmFyIHdheXBvaW50cyA9IHRoaXMudHJpZ2dlclF1ZXVlc1tkaXJlY3Rpb25dXHJcbiAgICAgIHZhciByZXZlcnNlID0gZGlyZWN0aW9uID09PSAndXAnIHx8IGRpcmVjdGlvbiA9PT0gJ2xlZnQnXHJcbiAgICAgIHdheXBvaW50cy5zb3J0KHJldmVyc2UgPyBieVJldmVyc2VUcmlnZ2VyUG9pbnQgOiBieVRyaWdnZXJQb2ludClcclxuICAgICAgZm9yICh2YXIgaSA9IDAsIGVuZCA9IHdheXBvaW50cy5sZW5ndGg7IGkgPCBlbmQ7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciB3YXlwb2ludCA9IHdheXBvaW50c1tpXVxyXG4gICAgICAgIGlmICh3YXlwb2ludC5vcHRpb25zLmNvbnRpbnVvdXMgfHwgaSA9PT0gd2F5cG9pbnRzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgIHdheXBvaW50LnRyaWdnZXIoW2RpcmVjdGlvbl0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsZWFyVHJpZ2dlclF1ZXVlcygpXHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgR3JvdXAucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbih3YXlwb2ludCkge1xyXG4gICAgdGhpcy53YXlwb2ludHMuc29ydChieVRyaWdnZXJQb2ludClcclxuICAgIHZhciBpbmRleCA9IFdheXBvaW50LkFkYXB0ZXIuaW5BcnJheSh3YXlwb2ludCwgdGhpcy53YXlwb2ludHMpXHJcbiAgICB2YXIgaXNMYXN0ID0gaW5kZXggPT09IHRoaXMud2F5cG9pbnRzLmxlbmd0aCAtIDFcclxuICAgIHJldHVybiBpc0xhc3QgPyBudWxsIDogdGhpcy53YXlwb2ludHNbaW5kZXggKyAxXVxyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIEdyb3VwLnByb3RvdHlwZS5wcmV2aW91cyA9IGZ1bmN0aW9uKHdheXBvaW50KSB7XHJcbiAgICB0aGlzLndheXBvaW50cy5zb3J0KGJ5VHJpZ2dlclBvaW50KVxyXG4gICAgdmFyIGluZGV4ID0gV2F5cG9pbnQuQWRhcHRlci5pbkFycmF5KHdheXBvaW50LCB0aGlzLndheXBvaW50cylcclxuICAgIHJldHVybiBpbmRleCA/IHRoaXMud2F5cG9pbnRzW2luZGV4IC0gMV0gOiBudWxsXHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgR3JvdXAucHJvdG90eXBlLnF1ZXVlVHJpZ2dlciA9IGZ1bmN0aW9uKHdheXBvaW50LCBkaXJlY3Rpb24pIHtcclxuICAgIHRoaXMudHJpZ2dlclF1ZXVlc1tkaXJlY3Rpb25dLnB1c2god2F5cG9pbnQpXHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgR3JvdXAucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHdheXBvaW50KSB7XHJcbiAgICB2YXIgaW5kZXggPSBXYXlwb2ludC5BZGFwdGVyLmluQXJyYXkod2F5cG9pbnQsIHRoaXMud2F5cG9pbnRzKVxyXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgdGhpcy53YXlwb2ludHMuc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyogUHVibGljICovXHJcbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2ZpcnN0ICovXHJcbiAgR3JvdXAucHJvdG90eXBlLmZpcnN0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy53YXlwb2ludHNbMF1cclxuICB9XHJcblxyXG4gIC8qIFB1YmxpYyAqL1xyXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9sYXN0ICovXHJcbiAgR3JvdXAucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLndheXBvaW50c1t0aGlzLndheXBvaW50cy5sZW5ndGggLSAxXVxyXG4gIH1cclxuXHJcbiAgLyogUHJpdmF0ZSAqL1xyXG4gIEdyb3VwLmZpbmRPckNyZWF0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICAgIHJldHVybiBncm91cHNbb3B0aW9ucy5heGlzXVtvcHRpb25zLm5hbWVdIHx8IG5ldyBHcm91cChvcHRpb25zKVxyXG4gIH1cclxuXHJcbiAgV2F5cG9pbnQuR3JvdXAgPSBHcm91cFxyXG59KCkpXHJcbjsoZnVuY3Rpb24oKSB7XHJcbiAgJ3VzZSBzdHJpY3QnXHJcblxyXG4gIHZhciBXYXlwb2ludCA9IHdpbmRvdy5XYXlwb2ludFxyXG5cclxuICBmdW5jdGlvbiBpc1dpbmRvdyhlbGVtZW50KSB7XHJcbiAgICByZXR1cm4gZWxlbWVudCA9PT0gZWxlbWVudC53aW5kb3dcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFdpbmRvdyhlbGVtZW50KSB7XHJcbiAgICBpZiAoaXNXaW5kb3coZWxlbWVudCkpIHtcclxuICAgICAgcmV0dXJuIGVsZW1lbnRcclxuICAgIH1cclxuICAgIHJldHVybiBlbGVtZW50LmRlZmF1bHRWaWV3XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBOb0ZyYW1ld29ya0FkYXB0ZXIoZWxlbWVudCkge1xyXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudFxyXG4gICAgdGhpcy5oYW5kbGVycyA9IHt9XHJcbiAgfVxyXG5cclxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLmlubmVySGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaXNXaW4gPSBpc1dpbmRvdyh0aGlzLmVsZW1lbnQpXHJcbiAgICByZXR1cm4gaXNXaW4gPyB0aGlzLmVsZW1lbnQuaW5uZXJIZWlnaHQgOiB0aGlzLmVsZW1lbnQuY2xpZW50SGVpZ2h0XHJcbiAgfVxyXG5cclxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLmlubmVyV2lkdGggPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBpc1dpbiA9IGlzV2luZG93KHRoaXMuZWxlbWVudClcclxuICAgIHJldHVybiBpc1dpbiA/IHRoaXMuZWxlbWVudC5pbm5lcldpZHRoIDogdGhpcy5lbGVtZW50LmNsaWVudFdpZHRoXHJcbiAgfVxyXG5cclxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50LCBoYW5kbGVyKSB7XHJcbiAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZWxlbWVudCwgbGlzdGVuZXJzLCBoYW5kbGVyKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA8IGVuZDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldXHJcbiAgICAgICAgaWYgKCFoYW5kbGVyIHx8IGhhbmRsZXIgPT09IGxpc3RlbmVyKSB7XHJcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobGlzdGVuZXIpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGV2ZW50UGFydHMgPSBldmVudC5zcGxpdCgnLicpXHJcbiAgICB2YXIgZXZlbnRUeXBlID0gZXZlbnRQYXJ0c1swXVxyXG4gICAgdmFyIG5hbWVzcGFjZSA9IGV2ZW50UGFydHNbMV1cclxuICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50XHJcblxyXG4gICAgaWYgKG5hbWVzcGFjZSAmJiB0aGlzLmhhbmRsZXJzW25hbWVzcGFjZV0gJiYgZXZlbnRUeXBlKSB7XHJcbiAgICAgIHJlbW92ZUxpc3RlbmVycyhlbGVtZW50LCB0aGlzLmhhbmRsZXJzW25hbWVzcGFjZV1bZXZlbnRUeXBlXSwgaGFuZGxlcilcclxuICAgICAgdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdW2V2ZW50VHlwZV0gPSBbXVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoZXZlbnRUeXBlKSB7XHJcbiAgICAgIGZvciAodmFyIG5zIGluIHRoaXMuaGFuZGxlcnMpIHtcclxuICAgICAgICByZW1vdmVMaXN0ZW5lcnMoZWxlbWVudCwgdGhpcy5oYW5kbGVyc1tuc11bZXZlbnRUeXBlXSB8fCBbXSwgaGFuZGxlcilcclxuICAgICAgICB0aGlzLmhhbmRsZXJzW25zXVtldmVudFR5cGVdID0gW11cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobmFtZXNwYWNlICYmIHRoaXMuaGFuZGxlcnNbbmFtZXNwYWNlXSkge1xyXG4gICAgICBmb3IgKHZhciB0eXBlIGluIHRoaXMuaGFuZGxlcnNbbmFtZXNwYWNlXSkge1xyXG4gICAgICAgIHJlbW92ZUxpc3RlbmVycyhlbGVtZW50LCB0aGlzLmhhbmRsZXJzW25hbWVzcGFjZV1bdHlwZV0sIGhhbmRsZXIpXHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdID0ge31cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qIEFkYXB0ZWQgZnJvbSBqUXVlcnkgMS54IG9mZnNldCgpICovXHJcbiAgTm9GcmFtZXdvcmtBZGFwdGVyLnByb3RvdHlwZS5vZmZzZXQgPSBmdW5jdGlvbigpIHtcclxuICAgIGlmICghdGhpcy5lbGVtZW50Lm93bmVyRG9jdW1lbnQpIHtcclxuICAgICAgcmV0dXJuIG51bGxcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZG9jdW1lbnRFbGVtZW50ID0gdGhpcy5lbGVtZW50Lm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XHJcbiAgICB2YXIgd2luID0gZ2V0V2luZG93KHRoaXMuZWxlbWVudC5vd25lckRvY3VtZW50KVxyXG4gICAgdmFyIHJlY3QgPSB7XHJcbiAgICAgIHRvcDogMCxcclxuICAgICAgbGVmdDogMFxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XHJcbiAgICAgIHJlY3QgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0b3A6IHJlY3QudG9wICsgd2luLnBhZ2VZT2Zmc2V0IC0gZG9jdW1lbnRFbGVtZW50LmNsaWVudFRvcCxcclxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luLnBhZ2VYT2Zmc2V0IC0gZG9jdW1lbnRFbGVtZW50LmNsaWVudExlZnRcclxuICAgIH1cclxuICB9XHJcblxyXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgaGFuZGxlcikge1xyXG4gICAgdmFyIGV2ZW50UGFydHMgPSBldmVudC5zcGxpdCgnLicpXHJcbiAgICB2YXIgZXZlbnRUeXBlID0gZXZlbnRQYXJ0c1swXVxyXG4gICAgdmFyIG5hbWVzcGFjZSA9IGV2ZW50UGFydHNbMV0gfHwgJ19fZGVmYXVsdCdcclxuICAgIHZhciBuc0hhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdID0gdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdIHx8IHt9XHJcbiAgICB2YXIgbnNUeXBlTGlzdCA9IG5zSGFuZGxlcnNbZXZlbnRUeXBlXSA9IG5zSGFuZGxlcnNbZXZlbnRUeXBlXSB8fCBbXVxyXG5cclxuICAgIG5zVHlwZUxpc3QucHVzaChoYW5kbGVyKVxyXG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyKVxyXG4gIH1cclxuXHJcbiAgTm9GcmFtZXdvcmtBZGFwdGVyLnByb3RvdHlwZS5vdXRlckhlaWdodCA9IGZ1bmN0aW9uKGluY2x1ZGVNYXJnaW4pIHtcclxuICAgIHZhciBoZWlnaHQgPSB0aGlzLmlubmVySGVpZ2h0KClcclxuICAgIHZhciBjb21wdXRlZFN0eWxlXHJcblxyXG4gICAgaWYgKGluY2x1ZGVNYXJnaW4gJiYgIWlzV2luZG93KHRoaXMuZWxlbWVudCkpIHtcclxuICAgICAgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudClcclxuICAgICAgaGVpZ2h0ICs9IHBhcnNlSW50KGNvbXB1dGVkU3R5bGUubWFyZ2luVG9wLCAxMClcclxuICAgICAgaGVpZ2h0ICs9IHBhcnNlSW50KGNvbXB1dGVkU3R5bGUubWFyZ2luQm90dG9tLCAxMClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGVpZ2h0XHJcbiAgfVxyXG5cclxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLm91dGVyV2lkdGggPSBmdW5jdGlvbihpbmNsdWRlTWFyZ2luKSB7XHJcbiAgICB2YXIgd2lkdGggPSB0aGlzLmlubmVyV2lkdGgoKVxyXG4gICAgdmFyIGNvbXB1dGVkU3R5bGVcclxuXHJcbiAgICBpZiAoaW5jbHVkZU1hcmdpbiAmJiAhaXNXaW5kb3codGhpcy5lbGVtZW50KSkge1xyXG4gICAgICBjb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50KVxyXG4gICAgICB3aWR0aCArPSBwYXJzZUludChjb21wdXRlZFN0eWxlLm1hcmdpbkxlZnQsIDEwKVxyXG4gICAgICB3aWR0aCArPSBwYXJzZUludChjb21wdXRlZFN0eWxlLm1hcmdpblJpZ2h0LCAxMClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gd2lkdGhcclxuICB9XHJcblxyXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5wcm90b3R5cGUuc2Nyb2xsTGVmdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHdpbiA9IGdldFdpbmRvdyh0aGlzLmVsZW1lbnQpXHJcbiAgICByZXR1cm4gd2luID8gd2luLnBhZ2VYT2Zmc2V0IDogdGhpcy5lbGVtZW50LnNjcm9sbExlZnRcclxuICB9XHJcblxyXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5wcm90b3R5cGUuc2Nyb2xsVG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgd2luID0gZ2V0V2luZG93KHRoaXMuZWxlbWVudClcclxuICAgIHJldHVybiB3aW4gPyB3aW4ucGFnZVlPZmZzZXQgOiB0aGlzLmVsZW1lbnQuc2Nyb2xsVG9wXHJcbiAgfVxyXG5cclxuICBOb0ZyYW1ld29ya0FkYXB0ZXIuZXh0ZW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcclxuXHJcbiAgICBmdW5jdGlvbiBtZXJnZSh0YXJnZXQsIG9iaikge1xyXG4gICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBvYmpba2V5XVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRhcmdldFxyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAxLCBlbmQgPSBhcmdzLmxlbmd0aDsgaSA8IGVuZDsgaSsrKSB7XHJcbiAgICAgIG1lcmdlKGFyZ3NbMF0sIGFyZ3NbaV0pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJnc1swXVxyXG4gIH1cclxuXHJcbiAgTm9GcmFtZXdvcmtBZGFwdGVyLmluQXJyYXkgPSBmdW5jdGlvbihlbGVtZW50LCBhcnJheSwgaSkge1xyXG4gICAgcmV0dXJuIGFycmF5ID09IG51bGwgPyAtMSA6IGFycmF5LmluZGV4T2YoZWxlbWVudCwgaSlcclxuICB9XHJcblxyXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5pc0VtcHR5T2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAvKiBlc2xpbnQgbm8tdW51c2VkLXZhcnM6IDAgKi9cclxuICAgIGZvciAodmFyIG5hbWUgaW4gb2JqKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcblxyXG4gIFdheXBvaW50LmFkYXB0ZXJzLnB1c2goe1xyXG4gICAgbmFtZTogJ25vZnJhbWV3b3JrJyxcclxuICAgIEFkYXB0ZXI6IE5vRnJhbWV3b3JrQWRhcHRlclxyXG4gIH0pXHJcbiAgV2F5cG9pbnQuQWRhcHRlciA9IE5vRnJhbWV3b3JrQWRhcHRlclxyXG59KCkpXHJcbjtcclxuLyohXHJcbldheXBvaW50cyBJbnZpZXcgU2hvcnRjdXQgLSA0LjAuMFxyXG5Db3B5cmlnaHQgwqkgMjAxMS0yMDE1IENhbGViIFRyb3VnaHRvblxyXG5MaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbmh0dHBzOi8vZ2l0aHViLmNvbS9pbWFrZXdlYnRoaW5ncy93YXlwb2ludHMvYmxvYi9tYXN0ZXIvbGljZW5zZXMudHh0XHJcbiovXHJcbihmdW5jdGlvbigpIHtcclxuICAndXNlIHN0cmljdCdcclxuXHJcbiAgZnVuY3Rpb24gbm9vcCgpIHt9XHJcblxyXG4gIHZhciBXYXlwb2ludCA9IHdpbmRvdy5XYXlwb2ludFxyXG5cclxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9zaG9ydGN1dHMvaW52aWV3ICovXHJcbiAgZnVuY3Rpb24gSW52aWV3KG9wdGlvbnMpIHtcclxuICAgIHRoaXMub3B0aW9ucyA9IFdheXBvaW50LkFkYXB0ZXIuZXh0ZW5kKHt9LCBJbnZpZXcuZGVmYXVsdHMsIG9wdGlvbnMpXHJcbiAgICB0aGlzLmF4aXMgPSB0aGlzLm9wdGlvbnMuaG9yaXpvbnRhbCA/ICdob3Jpem9udGFsJyA6ICd2ZXJ0aWNhbCdcclxuICAgIHRoaXMud2F5cG9pbnRzID0gW11cclxuICAgIHRoaXMuZWxlbWVudCA9IHRoaXMub3B0aW9ucy5lbGVtZW50XHJcbiAgICB0aGlzLmNyZWF0ZVdheXBvaW50cygpXHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgSW52aWV3LnByb3RvdHlwZS5jcmVhdGVXYXlwb2ludHMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBjb25maWdzID0ge1xyXG4gICAgICB2ZXJ0aWNhbDogW3tcclxuICAgICAgICBkb3duOiAnZW50ZXInLFxyXG4gICAgICAgIHVwOiAnZXhpdGVkJyxcclxuICAgICAgICBvZmZzZXQ6ICcxMDAlJ1xyXG4gICAgICB9LCB7XHJcbiAgICAgICAgZG93bjogJ2VudGVyZWQnLFxyXG4gICAgICAgIHVwOiAnZXhpdCcsXHJcbiAgICAgICAgb2Zmc2V0OiAnYm90dG9tLWluLXZpZXcnXHJcbiAgICAgIH0sIHtcclxuICAgICAgICBkb3duOiAnZXhpdCcsXHJcbiAgICAgICAgdXA6ICdlbnRlcmVkJyxcclxuICAgICAgICBvZmZzZXQ6IDBcclxuICAgICAgfSwge1xyXG4gICAgICAgIGRvd246ICdleGl0ZWQnLFxyXG4gICAgICAgIHVwOiAnZW50ZXInLFxyXG4gICAgICAgIG9mZnNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gLXRoaXMuYWRhcHRlci5vdXRlckhlaWdodCgpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XSxcclxuICAgICAgaG9yaXpvbnRhbDogW3tcclxuICAgICAgICByaWdodDogJ2VudGVyJyxcclxuICAgICAgICBsZWZ0OiAnZXhpdGVkJyxcclxuICAgICAgICBvZmZzZXQ6ICcxMDAlJ1xyXG4gICAgICB9LCB7XHJcbiAgICAgICAgcmlnaHQ6ICdlbnRlcmVkJyxcclxuICAgICAgICBsZWZ0OiAnZXhpdCcsXHJcbiAgICAgICAgb2Zmc2V0OiAncmlnaHQtaW4tdmlldydcclxuICAgICAgfSwge1xyXG4gICAgICAgIHJpZ2h0OiAnZXhpdCcsXHJcbiAgICAgICAgbGVmdDogJ2VudGVyZWQnLFxyXG4gICAgICAgIG9mZnNldDogMFxyXG4gICAgICB9LCB7XHJcbiAgICAgICAgcmlnaHQ6ICdleGl0ZWQnLFxyXG4gICAgICAgIGxlZnQ6ICdlbnRlcicsXHJcbiAgICAgICAgb2Zmc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiAtdGhpcy5hZGFwdGVyLm91dGVyV2lkdGgoKVxyXG4gICAgICAgIH1cclxuICAgICAgfV1cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMCwgZW5kID0gY29uZmlnc1t0aGlzLmF4aXNdLmxlbmd0aDsgaSA8IGVuZDsgaSsrKSB7XHJcbiAgICAgIHZhciBjb25maWcgPSBjb25maWdzW3RoaXMuYXhpc11baV1cclxuICAgICAgdGhpcy5jcmVhdGVXYXlwb2ludChjb25maWcpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiBQcml2YXRlICovXHJcbiAgSW52aWV3LnByb3RvdHlwZS5jcmVhdGVXYXlwb2ludCA9IGZ1bmN0aW9uKGNvbmZpZykge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzXHJcbiAgICB0aGlzLndheXBvaW50cy5wdXNoKG5ldyBXYXlwb2ludCh7XHJcbiAgICAgIGNvbnRleHQ6IHRoaXMub3B0aW9ucy5jb250ZXh0LFxyXG4gICAgICBlbGVtZW50OiB0aGlzLm9wdGlvbnMuZWxlbWVudCxcclxuICAgICAgZW5hYmxlZDogdGhpcy5vcHRpb25zLmVuYWJsZWQsXHJcbiAgICAgIGhhbmRsZXI6IChmdW5jdGlvbihjb25maWcpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGlyZWN0aW9uKSB7XHJcbiAgICAgICAgICBzZWxmLm9wdGlvbnNbY29uZmlnW2RpcmVjdGlvbl1dLmNhbGwoc2VsZiwgZGlyZWN0aW9uKVxyXG4gICAgICAgIH1cclxuICAgICAgfShjb25maWcpKSxcclxuICAgICAgb2Zmc2V0OiBjb25maWcub2Zmc2V0LFxyXG4gICAgICBob3Jpem9udGFsOiB0aGlzLm9wdGlvbnMuaG9yaXpvbnRhbFxyXG4gICAgfSkpXHJcbiAgfVxyXG5cclxuICAvKiBQdWJsaWMgKi9cclxuICBJbnZpZXcucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcclxuICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSB0aGlzLndheXBvaW50cy5sZW5ndGg7IGkgPCBlbmQ7IGkrKykge1xyXG4gICAgICB0aGlzLndheXBvaW50c1tpXS5kZXN0cm95KClcclxuICAgIH1cclxuICAgIHRoaXMud2F5cG9pbnRzID0gW11cclxuICB9XHJcblxyXG4gIEludmlldy5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGVuZCA9IHRoaXMud2F5cG9pbnRzLmxlbmd0aDsgaSA8IGVuZDsgaSsrKSB7XHJcbiAgICAgIHRoaXMud2F5cG9pbnRzW2ldLmRpc2FibGUoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgSW52aWV3LnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbigpIHtcclxuICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSB0aGlzLndheXBvaW50cy5sZW5ndGg7IGkgPCBlbmQ7IGkrKykge1xyXG4gICAgICB0aGlzLndheXBvaW50c1tpXS5lbmFibGUoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgSW52aWV3LmRlZmF1bHRzID0ge1xyXG4gICAgY29udGV4dDogd2luZG93LFxyXG4gICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgIGVudGVyOiBub29wLFxyXG4gICAgZW50ZXJlZDogbm9vcCxcclxuICAgIGV4aXQ6IG5vb3AsXHJcbiAgICBleGl0ZWQ6IG5vb3BcclxuICB9XHJcblxyXG4gIFdheXBvaW50LkludmlldyA9IEludmlld1xyXG59KCkpXHJcbjtcclxuIiwiLyoqXHJcbiAqIFplbnNjcm9sbCAzLjAuMVxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vemVuZ2Fib3IvemVuc2Nyb2xsL1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgMjAxNeKAkzIwMTYgR2Fib3IgTGVuYXJkXHJcbiAqXHJcbiAqIFRoaXMgaXMgZnJlZSBhbmQgdW5lbmN1bWJlcmVkIHNvZnR3YXJlIHJlbGVhc2VkIGludG8gdGhlIHB1YmxpYyBkb21haW4uXHJcbiAqXHJcbiAqIEFueW9uZSBpcyBmcmVlIHRvIGNvcHksIG1vZGlmeSwgcHVibGlzaCwgdXNlLCBjb21waWxlLCBzZWxsLCBvclxyXG4gKiBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUsIGVpdGhlciBpbiBzb3VyY2UgY29kZSBmb3JtIG9yIGFzIGEgY29tcGlsZWRcclxuICogYmluYXJ5LCBmb3IgYW55IHB1cnBvc2UsIGNvbW1lcmNpYWwgb3Igbm9uLWNvbW1lcmNpYWwsIGFuZCBieSBhbnlcclxuICogbWVhbnMuXHJcbiAqXHJcbiAqIEluIGp1cmlzZGljdGlvbnMgdGhhdCByZWNvZ25pemUgY29weXJpZ2h0IGxhd3MsIHRoZSBhdXRob3Igb3IgYXV0aG9yc1xyXG4gKiBvZiB0aGlzIHNvZnR3YXJlIGRlZGljYXRlIGFueSBhbmQgYWxsIGNvcHlyaWdodCBpbnRlcmVzdCBpbiB0aGVcclxuICogc29mdHdhcmUgdG8gdGhlIHB1YmxpYyBkb21haW4uIFdlIG1ha2UgdGhpcyBkZWRpY2F0aW9uIGZvciB0aGUgYmVuZWZpdFxyXG4gKiBvZiB0aGUgcHVibGljIGF0IGxhcmdlIGFuZCB0byB0aGUgZGV0cmltZW50IG9mIG91ciBoZWlycyBhbmRcclxuICogc3VjY2Vzc29ycy4gV2UgaW50ZW5kIHRoaXMgZGVkaWNhdGlvbiB0byBiZSBhbiBvdmVydCBhY3Qgb2ZcclxuICogcmVsaW5xdWlzaG1lbnQgaW4gcGVycGV0dWl0eSBvZiBhbGwgcHJlc2VudCBhbmQgZnV0dXJlIHJpZ2h0cyB0byB0aGlzXHJcbiAqIHNvZnR3YXJlIHVuZGVyIGNvcHlyaWdodCBsYXcuXHJcbiAqXHJcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXHJcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxyXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXHJcbiAqIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SXHJcbiAqIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLFxyXG4gKiBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1JcclxuICogT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxyXG4gKlxyXG4gKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiwgcGxlYXNlIHJlZmVyIHRvIDxodHRwOi8vdW5saWNlbnNlLm9yZz5cclxuICpcclxuICovXHJcblxyXG4vKmpzaGludCBkZXZlbDp0cnVlLCBhc2k6dHJ1ZSAqL1xyXG5cclxuLypnbG9iYWwgZGVmaW5lLCBtb2R1bGUgKi9cclxuXHJcblxyXG4oZnVuY3Rpb24gKHJvb3QsIHplbnNjcm9sbCkge1xyXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFtdLCB6ZW5zY3JvbGwoKSlcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gemVuc2Nyb2xsKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcm9vdC56ZW5zY3JvbGwgPSB6ZW5zY3JvbGwoKVxyXG4gICAgfVxyXG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcclxuICAgIFwidXNlIHN0cmljdFwiXHJcblxyXG4gICAgdmFyIGNyZWF0ZVNjcm9sbGVyID0gZnVuY3Rpb24gKHNjcm9sbENvbnRhaW5lciwgZGVmYXVsdER1cmF0aW9uLCBlZGdlT2Zmc2V0KSB7XHJcblxyXG4gICAgICAgIGRlZmF1bHREdXJhdGlvbiA9IGRlZmF1bHREdXJhdGlvbiB8fCA5OTkgLy9tc1xyXG4gICAgICAgIGlmICghZWRnZU9mZnNldCB8fCBlZGdlT2Zmc2V0ICE9PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFdoZW4gc2Nyb2xsaW5nLCB0aGlzIGFtb3VudCBvZiBkaXN0YW5jZSBpcyBrZXB0IGZyb20gdGhlIGVkZ2VzIG9mIHRoZSBzY3JvbGxDb250YWluZXI6XHJcbiAgICAgICAgICAgIGVkZ2VPZmZzZXQgPSA5IC8vcHhcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzY3JvbGxUaW1lb3V0SWRcclxuICAgICAgICB2YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxyXG5cclxuICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIGJyb3dzZXIgYWxyZWFkeSBzdXBwb3J0cyBuYXRpdmUgc21vb3RoIHNjcm9sbGluZyAoZS5nLiwgRmlyZWZveCAzNisgYW5kIENocm9tZSA0OSspIGFuZCBpdCBpcyBlbmFibGVkOlxyXG4gICAgICAgIHZhciBuYXRpdmVTbW9vdGhTY3JvbGxFbmFibGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKFwiZ2V0Q29tcHV0ZWRTdHlsZVwiIGluIHdpbmRvdykgJiZcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHNjcm9sbENvbnRhaW5lciA/IHNjcm9sbENvbnRhaW5lciA6IGRvY3VtZW50LmJvZHkpW1wic2Nyb2xsLWJlaGF2aW9yXCJdID09PSBcInNtb290aFwiXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2Nyb2xsQ29udGFpbmVyID8gc2Nyb2xsQ29udGFpbmVyLnNjcm9sbFRvcCA6ICh3aW5kb3cuc2Nyb2xsWSB8fCBkb2NFbGVtLnNjcm9sbFRvcClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBnZXRWaWV3SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2Nyb2xsQ29udGFpbmVyID9cclxuICAgICAgICAgICAgICAgIE1hdGgubWluKHNjcm9sbENvbnRhaW5lci5vZmZzZXRIZWlnaHQsIHdpbmRvdy5pbm5lckhlaWdodCkgOlxyXG4gICAgICAgICAgICAgICAgd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY0VsZW0uY2xpZW50SGVpZ2h0XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZ2V0UmVsYXRpdmVUb3BPZiA9IGZ1bmN0aW9uIChlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChzY3JvbGxDb250YWluZXIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLm9mZnNldFRvcCAtIHNjcm9sbENvbnRhaW5lci5vZmZzZXRUb3BcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArIGdldFNjcm9sbFRvcCgpIC0gZG9jRWxlbS5vZmZzZXRUb3BcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSW1tZWRpYXRlbHkgc3RvcHMgdGhlIGN1cnJlbnQgc21vb3RoIHNjcm9sbCBvcGVyYXRpb25cclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgc3RvcFNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHNjcm9sbFRpbWVvdXRJZClcclxuICAgICAgICAgICAgc2Nyb2xsVGltZW91dElkID0gMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2Nyb2xscyB0byBhIHNwZWNpZmljIHZlcnRpY2FsIHBvc2l0aW9uIGluIHRoZSBkb2N1bWVudC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZW5kWX0gVGhlIHZlcnRpY2FsIHBvc2l0aW9uIHdpdGhpbiB0aGUgZG9jdW1lbnQuXHJcbiAgICAgICAgICogQHBhcmFtIHtkdXJhdGlvbn0gT3B0aW9uYWxseSB0aGUgZHVyYXRpb24gb2YgdGhlIHNjcm9sbCBvcGVyYXRpb24uXHJcbiAgICAgICAgICogICAgICAgIElmIDAgb3Igbm90IHByb3ZpZGVkIGl0IGlzIGF1dG9tYXRpY2FsbHkgY2FsY3VsYXRlZCBiYXNlZCBvbiB0aGVcclxuICAgICAgICAgKiAgICAgICAgZGlzdGFuY2UgYW5kIHRoZSBkZWZhdWx0IGR1cmF0aW9uLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBzY3JvbGxUb1kgPSBmdW5jdGlvbiAoZW5kWSwgZHVyYXRpb24pIHtcclxuICAgICAgICAgICAgc3RvcFNjcm9sbCgpXHJcbiAgICAgICAgICAgIGlmIChuYXRpdmVTbW9vdGhTY3JvbGxFbmFibGVkKCkpIHtcclxuICAgICAgICAgICAgICAgIChzY3JvbGxDb250YWluZXIgfHwgd2luZG93KS5zY3JvbGxUbygwLCBlbmRZKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0WSA9IGdldFNjcm9sbFRvcCgpXHJcbiAgICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLm1heChlbmRZLDApIC0gc3RhcnRZXHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IE1hdGgubWluKE1hdGguYWJzKGRpc3RhbmNlKSwgZGVmYXVsdER1cmF0aW9uKVxyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgKGZ1bmN0aW9uIGxvb3BTY3JvbGwoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gTWF0aC5taW4oKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSAvIGR1cmF0aW9uLCAxKSAvLyBwZXJjZW50YWdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ID0gTWF0aC5tYXgoTWF0aC5mbG9vcihzdGFydFkgKyBkaXN0YW5jZSoocCA8IDAuNSA/IDIqcCpwIDogcCooNCAtIHAqMiktMSkpLCAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wID0geVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHAgPCAxICYmIChnZXRWaWV3SGVpZ2h0KCkgKyB5KSA8IChzY3JvbGxDb250YWluZXIgfHwgZG9jRWxlbSkuc2Nyb2xsSGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb29wU2Nyb2xsKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoc3RvcFNjcm9sbCwgOTkpIC8vIHdpdGggY29vbGRvd24gdGltZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgOSlcclxuICAgICAgICAgICAgICAgIH0pKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2Nyb2xscyB0byB0aGUgdG9wIG9mIGEgc3BlY2lmaWMgZWxlbWVudC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZWxlbX0gVGhlIGVsZW1lbnQuXHJcbiAgICAgICAgICogQHBhcmFtIHtkdXJhdGlvbn0gT3B0aW9uYWxseSB0aGUgZHVyYXRpb24gb2YgdGhlIHNjcm9sbCBvcGVyYXRpb24uXHJcbiAgICAgICAgICogICAgICAgIEEgdmFsdWUgb2YgMCBpcyBpZ25vcmVkLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBzY3JvbGxUb0VsZW0gPSBmdW5jdGlvbiAoZWxlbSwgZHVyYXRpb24pIHtcclxuICAgICAgICAgICAgc2Nyb2xsVG9ZKGdldFJlbGF0aXZlVG9wT2YoZWxlbSkgLSBlZGdlT2Zmc2V0LCBkdXJhdGlvbilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFNjcm9sbHMgYW4gZWxlbWVudCBpbnRvIHZpZXcgaWYgbmVjZXNzYXJ5LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtlbGVtfSBUaGUgZWxlbWVudC5cclxuICAgICAgICAgKiBAcGFyYW0ge2R1cmF0aW9ufSBPcHRpb25hbGx5IHRoZSBkdXJhdGlvbiBvZiB0aGUgc2Nyb2xsIG9wZXJhdGlvbi5cclxuICAgICAgICAgKiAgICAgICAgQSB2YWx1ZSBvZiAwIGlzIGlnbm9yZWQuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIHNjcm9sbEludG9WaWV3ID0gZnVuY3Rpb24gKGVsZW0sIGR1cmF0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtU2Nyb2xsSGVpZ2h0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQgKyAyKmVkZ2VPZmZzZXRcclxuICAgICAgICAgICAgdmFyIHZIZWlnaHQgPSBnZXRWaWV3SGVpZ2h0KClcclxuICAgICAgICAgICAgdmFyIGVsZW1Ub3AgPSBnZXRSZWxhdGl2ZVRvcE9mKGVsZW0pXHJcbiAgICAgICAgICAgIHZhciBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1TY3JvbGxIZWlnaHRcclxuICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IGdldFNjcm9sbFRvcCgpXHJcbiAgICAgICAgICAgIGlmICgoZWxlbVRvcCAtIHNjcm9sbFRvcCkgPCBlZGdlT2Zmc2V0IHx8IGVsZW1TY3JvbGxIZWlnaHQgPiB2SGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFbGVtZW50IGlzIGNsaXBwZWQgYXQgdG9wIG9yIGlzIGhpZ2hlciB0aGFuIHNjcmVlbi5cclxuICAgICAgICAgICAgICAgIHNjcm9sbFRvRWxlbShlbGVtLCBkdXJhdGlvbilcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgoc2Nyb2xsVG9wICsgdkhlaWdodCAtIGVsZW1Cb3R0b20pIDwgZWRnZU9mZnNldCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRWxlbWVudCBpcyBjbGlwcGVkIGF0IHRoZSBib3R0b20uXHJcbiAgICAgICAgICAgICAgICBzY3JvbGxUb1koZWxlbUJvdHRvbSAtIHZIZWlnaHQsIGR1cmF0aW9uKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTY3JvbGxzIHRvIHRoZSBjZW50ZXIgb2YgYW4gZWxlbWVudC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7ZWxlbX0gVGhlIGVsZW1lbnQuXHJcbiAgICAgICAgICogQHBhcmFtIHtkdXJhdGlvbn0gT3B0aW9uYWxseSB0aGUgZHVyYXRpb24gb2YgdGhlIHNjcm9sbCBvcGVyYXRpb24uXHJcbiAgICAgICAgICogQHBhcmFtIHtvZmZzZXR9IE9wdGlvbmFsbHkgdGhlIG9mZnNldCBvZiB0aGUgdG9wIG9mIHRoZSBlbGVtZW50IGZyb20gdGhlIGNlbnRlciBvZiB0aGUgc2NyZWVuLlxyXG4gICAgICAgICAqICAgICAgICBBIHZhbHVlIG9mIDAgaXMgaWdub3JlZC5cclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgc2Nyb2xsVG9DZW50ZXJPZiA9IGZ1bmN0aW9uIChlbGVtLCBkdXJhdGlvbiwgb2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHNjcm9sbFRvWShcclxuICAgICAgICAgICAgICAgIE1hdGgubWF4KFxyXG4gICAgICAgICAgICAgICAgICAgIGdldFJlbGF0aXZlVG9wT2YoZWxlbSkgLSBnZXRWaWV3SGVpZ2h0KCkvMiArIChvZmZzZXQgfHwgZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQvMiksXHJcbiAgICAgICAgICAgICAgICAgICAgMFxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENoYW5nZXMgZGVmYXVsdCBzZXR0aW5ncyBmb3IgdGhpcyBzY3JvbGxlci5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7bmV3RGVmYXVsdER1cmF0aW9ufSBOZXcgdmFsdWUgZm9yIGRlZmF1bHQgZHVyYXRpb24sIHVzZWQgZm9yIGVhY2ggc2Nyb2xsIG1ldGhvZCBieSBkZWZhdWx0LlxyXG4gICAgICAgICAqICAgICAgICBJZ25vcmVkIGlmIDAgb3IgZmFsc3kuXHJcbiAgICAgICAgICogQHBhcmFtIHtuZXdFZGdlT2Zmc2V0fSBOZXcgdmFsdWUgZm9yIHRoZSBlZGdlIG9mZnNldCwgdXNlZCBieSBlYWNoIHNjcm9sbCBtZXRob2QgYnkgZGVmYXVsdC5cclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgc2V0dXAgPSBmdW5jdGlvbiAobmV3RGVmYXVsdER1cmF0aW9uLCBuZXdFZGdlT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIGlmIChuZXdEZWZhdWx0RHVyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHREdXJhdGlvbiA9IG5ld0RlZmF1bHREdXJhdGlvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChuZXdFZGdlT2Zmc2V0ID09PSAwIHx8IG5ld0VkZ2VPZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgIGVkZ2VPZmZzZXQgPSBuZXdFZGdlT2Zmc2V0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHNldHVwOiBzZXR1cCxcclxuICAgICAgICAgICAgdG86IHNjcm9sbFRvRWxlbSxcclxuICAgICAgICAgICAgdG9ZOiBzY3JvbGxUb1ksXHJcbiAgICAgICAgICAgIGludG9WaWV3OiBzY3JvbGxJbnRvVmlldyxcclxuICAgICAgICAgICAgY2VudGVyOiBzY3JvbGxUb0NlbnRlck9mLFxyXG4gICAgICAgICAgICBzdG9wOiBzdG9wU2Nyb2xsLFxyXG4gICAgICAgICAgICBtb3Zpbmc6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICEhc2Nyb2xsVGltZW91dElkIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSBhIHNjcm9sbGVyIGZvciB0aGUgYnJvd3NlciB3aW5kb3csIG9taXR0aW5nIHBhcmFtZXRlcnM6XHJcbiAgICB2YXIgZGVmYXVsdFNjcm9sbGVyID0gY3JlYXRlU2Nyb2xsZXIoKVxyXG5cclxuICAgIC8vIENyZWF0ZSBsaXN0ZW5lcnMgZm9yIHRoZSBkb2N1bWVudEVsZW1lbnQgb25seSAmIGV4Y2x1ZGUgSUU4LVxyXG4gICAgaWYgKFwiYWRkRXZlbnRMaXN0ZW5lclwiIGluIHdpbmRvdyAmJiBkb2N1bWVudC5ib2R5LnN0eWxlLnNjcm9sbEJlaGF2aW9yICE9PSBcInNtb290aFwiICYmICF3aW5kb3cubm9aZW5zbW9vdGgpIHtcclxuICAgICAgICB2YXIgcmVwbGFjZVVybCA9IGZ1bmN0aW9uIChoYXNoKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgXCJcIiwgd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCIjXCIpWzBdICsgaGFzaClcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVG8gYXZvaWQgdGhlIFNlY3VyaXR5IGV4Y2VwdGlvbiBpbiBDaHJvbWUgd2hlbiB0aGUgcGFnZSB3YXMgb3BlbmVkIHZpYSB0aGUgZmlsZSBwcm90b2NvbCwgZS5nLiwgZmlsZTovL2luZGV4Lmh0bWxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICB2YXIgYW5jaG9yID0gZXZlbnQudGFyZ2V0XHJcbiAgICAgICAgICAgIHdoaWxlIChhbmNob3IgJiYgYW5jaG9yLnRhZ05hbWUgIT09IFwiQVwiKSB7XHJcbiAgICAgICAgICAgICAgICBhbmNob3IgPSBhbmNob3IucGFyZW50Tm9kZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghYW5jaG9yIHx8IGV2ZW50LndoaWNoICE9PSAxIHx8IGV2ZW50LnNoaWZ0S2V5IHx8IGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSB8fCBldmVudC5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBocmVmID0gYW5jaG9yLmdldEF0dHJpYnV0ZShcImhyZWZcIikgfHwgXCJcIlxyXG4gICAgICAgICAgICBpZiAoaHJlZi5pbmRleE9mKFwiI1wiKSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGhyZWYgPT09IFwiI1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKSAvLyBQcmV2ZW50IHRoZSBicm93c2VyIGZyb20gaGFuZGxpbmcgdGhlIGFjdGl2YXRpb24gb2YgdGhlIGxpbmtcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0U2Nyb2xsZXIudG9ZKDApXHJcbiAgICAgICAgICAgICAgICAgICAgcmVwbGFjZVVybChcIlwiKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SWQgPSBhbmNob3IuaGFzaC5zdWJzdHJpbmcoMSlcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0RWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhcmdldElkKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRFbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCkgLy8gUHJldmVudCB0aGUgYnJvd3NlciBmcm9tIGhhbmRsaW5nIHRoZSBhY3RpdmF0aW9uIG9mIHRoZSBsaW5rXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRTY3JvbGxlci50byh0YXJnZXRFbGVtKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXBsYWNlVXJsKFwiI1wiICsgdGFyZ2V0SWQpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZmFsc2UpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAvLyBFeHBvc2UgdGhlIFwiY29uc3RydWN0b3JcIiB0aGF0IGNhbiBjcmVhdGUgYSBuZXcgc2Nyb2xsZXI6XHJcbiAgICAgICAgY3JlYXRlU2Nyb2xsZXI6IGNyZWF0ZVNjcm9sbGVyLFxyXG4gICAgICAgIC8vIFN1cmZhY2UgdGhlIG1ldGhvZHMgb2YgdGhlIGRlZmF1bHQgc2Nyb2xsZXI6XHJcbiAgICAgICAgc2V0dXA6IGRlZmF1bHRTY3JvbGxlci5zZXR1cCxcclxuICAgICAgICB0bzogZGVmYXVsdFNjcm9sbGVyLnRvLFxyXG4gICAgICAgIHRvWTogZGVmYXVsdFNjcm9sbGVyLnRvWSxcclxuICAgICAgICBpbnRvVmlldzogZGVmYXVsdFNjcm9sbGVyLmludG9WaWV3LFxyXG4gICAgICAgIGNlbnRlcjogZGVmYXVsdFNjcm9sbGVyLmNlbnRlcixcclxuICAgICAgICBzdG9wOiBkZWZhdWx0U2Nyb2xsZXIuc3RvcCxcclxuICAgICAgICBtb3Zpbmc6IGRlZmF1bHRTY3JvbGxlci5tb3ZpbmdcclxuICAgIH1cclxuXHJcbn0pKTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gSW1wb3J0Q3VzdG9tRm9udCgpIHtcclxuICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAga2l0SWQ6ICdxdHE1cW5oJyxcclxuICAgICAgICBzY3JpcHRUaW1lb3V0OiAzMDAwLFxyXG4gICAgICAgIGFzeW5jOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBoID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgdmFyIHQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBoLmNsYXNzTmFtZSA9IGguY2xhc3NOYW1lLnJlcGxhY2UoL1xcYndmLWxvYWRpbmdcXGIvZywgXCJcIikgKyBcIiB3Zi1pbmFjdGl2ZVwiO1xyXG4gICAgfSwgY29uZmlnLnNjcmlwdFRpbWVvdXQpO1xyXG5cclxuICAgIHZhciB0ayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XHJcbiAgICB2YXIgZiA9IGZhbHNlO1xyXG4gICAgdmFyIHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKVswXTtcclxuICAgIHZhciBhO1xyXG5cclxuICAgIGguY2xhc3NOYW1lICs9IFwiIHdmLWxvYWRpbmdcIjtcclxuICAgIHRrLnNyYyA9ICdodHRwczovL3VzZS50eXBla2l0Lm5ldC8nICsgY29uZmlnLmtpdElkICsgJy5qcyc7XHJcbiAgICB0ay5hc3luYyA9IHRydWU7XHJcbiAgICB0ay5vbmxvYWQgPSB0ay5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYSA9IHRoaXMucmVhZHlTdGF0ZTtcclxuICAgICAgICBpZiAoZiB8fCBhICYmIGEgIT0gXCJjb21wbGV0ZVwiICYmIGEgIT0gXCJsb2FkZWRcIikgcmV0dXJuO1xyXG4gICAgICAgIGYgPSB0cnVlO1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0KTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBUeXBla2l0LmxvYWQoY29uZmlnKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICB9O1xyXG5cclxuICAgIHMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGssIHMpXHJcbn07XHJcbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFByaW1hcnlOYXYoKSB7XHJcblxyXG4gICAgLy8gY2FjaGUgZG9tIGVsZW1lbnRzXHJcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHksXHJcbiAgICAgICAgbmF2VHJpZ2dlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanMtbmF2LXRyaWdnZXJcIiksXHJcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5jb250YWluZXJcIiksXHJcbiAgICAgICAgcHJpbWFyeU5hdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuanMtcHJpbWFyeS1uYXZcIiksXHJcbiAgICAgICAgcHJpbWFyeU5hdkxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5qcy1wcmltYXJ5LW5hdiBhXCIpO1xyXG5cclxuICAgIC8vIEZsYWcgdGhhdCBKUyBoYXMgbG9hZGVkXHJcbiAgICBib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJuby1qc1wiKTtcclxuICAgIGJvZHkuY2xhc3NMaXN0LmFkZChcImpzXCIpO1xyXG5cclxuICAgIC8vIEhhbWJ1cmdlciBtZW51XHJcbiAgICBuYXZUcmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpe1xyXG4gICAgICAgIC8vIHRvZ2dsZSBhY3RpdmUgY2xhc3Mgb24gdGhlIG5hdiB0cmlnZ2VyXHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKFwib3BlblwiKTtcclxuICAgICAgICAvLyB0b2dnbGUgdGhlIGFjdGl2ZSBjbGFzcyBvbiBzaXRlIGNvbnRhaW5lclxyXG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKFwianMtbmF2LWFjdGl2ZVwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluLW1lbnUgbGluayBjbGlja1xyXG4gICAgZm9yKHZhciBpPTA7IGkgPCBwcmltYXJ5TmF2TGlua3MubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIHZhciBwcmltYXJ5TmF2TGluayA9IHByaW1hcnlOYXZMaW5rc1tpXTtcclxuICAgICAgICBwcmltYXJ5TmF2TGluay5vbmNsaWNrID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgLy8gdG9nZ2xlIGFjdGl2ZSBjbGFzcyBvbiB0aGUgbmF2IHRyaWdnZXJcclxuICAgICAgICAgICAgbmF2VHJpZ2dlci5jbGFzc0xpc3QudG9nZ2xlKFwib3BlblwiKTtcclxuICAgICAgICAgICAgLy8gaW1tZWRpYXRlbHkgaGlkZSB0aGUgbmF2XHJcbiAgICAgICAgICAgIHByaW1hcnlOYXYuc3R5bGUub3BhY2l0eT0gXCIwXCI7XHJcbiAgICAgICAgICAgIC8vIG9uY2UgZHJhd2VyIGhhcyBoYWQgdGltZSB0byBwdWxsIHVwLCByZXN0b3JlIG9wYWNpdHlcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgcHJpbWFyeU5hdi5zdHlsZS5vcGFjaXR5PSBcIjFcIjsgfSwgMTAwMCk7XHJcbiAgICAgICAgICAgIC8vIHRvZ2dsZSB0aGUgYWN0aXZlIGNsYXNzIG9uIHNpdGUgY29udGFpbmVyXHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKFwianMtbmF2LWFjdGl2ZVwiKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxufTtcclxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gVGltZWxpbmVMb2FkaW5nKCkge1xyXG5cclxuICB2YXIgdGltZWxpbmVCbG9ja3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNkLXRpbWVsaW5lLWJsb2NrLCAuY2dkLXRpbWVsaW5lLWJsb2NrXCIpO1xyXG5cclxuICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHRpbWVsaW5lQmxvY2tzLCBmdW5jdGlvbihlbCwgaSl7XHJcblxyXG4gICAgdmFyIHdheXBvaW50ID0gbmV3IFdheXBvaW50KHtcclxuICAgICAgZWxlbWVudDogZWwsXHJcbiAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2ZhZGVJblVwJyk7XHJcbiAgICAgIH0sXHJcbiAgICAgIG9mZnNldDogJzc1JSdcclxuICAgIH0pXHJcblxyXG4gIH0pO1xyXG59O1xyXG4iXX0=
