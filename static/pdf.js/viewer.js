/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals pdfjsLib, pdfjsViewer */

'use strict';

if (!pdfjsLib.getDocument || !pdfjsViewer.PDFViewer) {
  alert('Please build the pdfjs-dist library using\n `gulp dist-install`');
}

// var USE_ONLY_CSS_ZOOM = true;
var USE_ONLY_CSS_ZOOM = false;
var TEXT_LAYER_MODE = 0; // DISABLE
// var TEXT_LAYER_MODE = 1; // ENABLE

// var MAX_IMAGE_SIZE = 1024 * 1024;
// var CMAP_URL = '../../node_modules/pdfjs-dist/cmaps/';
// var CMAP_PACKED = true;
 
// pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/pdf.js/pdf.worker.min.js';
var DEFAULT_URL = window.source_url
var DEFAULT_SCALE_DELTA = 1.1;
var MIN_SCALE = 0.25;
var MAX_SCALE = 10.0;
// var DEFAULT_SCALE_VALUE = 'auto';
var DEFAULT_SCALE_VALUE = 'page-width';

var PDFViewerApplication = {
  pdfLoadingTask: null,
  pdfDocument: null,
  pdfViewer: null,
  pdfHistory: null,
  pdfLinkService: null,
  previousScale: 0,
  pageTotal: 0,

  /**
   * Opens PDF document specified by URL.
   * @returns {Promise} - Returns the promise, which is resolved when document
   *                      is opened.
   */
  open: function (params) {
    if (this.pdfLoadingTask) {
      // We need to destroy already opened document
      return this.close().then(function () {
        // ... and repeat the open() call.
        return this.open(params);
      }.bind(this));
    }

    var url = params.url;
    var self = this;

    // Loading document.
    var loadingTask = pdfjsLib.getDocument({
      url: url,
      disableRange: true,
      disableStream: true,
      // maxImageSize: MAX_IMAGE_SIZE,
      // cMapUrl: CMAP_URL,
      // cMapPacked: CMAP_PACKED,
    });
    this.pdfLoadingTask = loadingTask;

    return loadingTask.promise.then(function (pdfDocument) {
      // Document loaded, specifying document for the viewer.
      self.pdfDocument = pdfDocument;
      self.pdfViewer.setDocument(pdfDocument);
      self.pdfLinkService.setDocument(pdfDocument);
      self.pdfHistory.initialize(pdfDocument.fingerprint);

    }, function (exception) {
      var message = exception && exception.message;
      var l10n = self.l10n;
      var loadingErrorMessage;

      if (exception instanceof pdfjsLib.InvalidPDFException) {
        // change error message also for other builds
        loadingErrorMessage = l10n.get('invalid_file_error', null,
          'Invalid or corrupted PDF file.');
      } else if (exception instanceof pdfjsLib.MissingPDFException) {
        // special message for missing PDFs
        loadingErrorMessage = l10n.get('missing_file_error', null,
          'Missing PDF file.');
      } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
        loadingErrorMessage = l10n.get('unexpected_response_error', null,
          'Unexpected server response.');
      } else {
        loadingErrorMessage = l10n.get('loading_error', null,
          'An error occurred while loading the PDF.');
      }

      loadingErrorMessage.then(function (msg) {
        self.error(msg, {message: message});
      });
      self.loadingBar.hide();
    });
  },

  /**
   * Closes opened PDF document.
   * @returns {Promise} - Returns the promise, which is resolved when all
   *                      destruction is completed.
   */
  close: function () {
    var errorWrapper = document.getElementById('errorWrapper');
    errorWrapper.setAttribute('hidden', 'true');

    if (!this.pdfLoadingTask) {
      return Promise.resolve();
    }

    var promise = this.pdfLoadingTask.destroy();
    this.pdfLoadingTask = null;

    if (this.pdfDocument) {
      this.pdfDocument = null;

      this.pdfViewer.setDocument(null);
      this.pdfLinkService.setDocument(null, null);
    }

    return promise;
  },

  
  error: function pdfViewError(message, moreInfo) {
    var l10n = this.l10n;
    var moreInfoText = [l10n.get('error_version_info',
      { version: pdfjsLib.version || '?',
        build: pdfjsLib.build || '?' },
      'PDF.js v{{version}} (build: {{build}})')];

    if (moreInfo) {
      moreInfoText.push(
        l10n.get('error_message', {message: moreInfo.message},
          'Message: {{message}}'));
      if (moreInfo.stack) {
        moreInfoText.push(
          l10n.get('error_stack', {stack: moreInfo.stack},
            'Stack: {{stack}}'));
      } else {
        if (moreInfo.filename) {
          moreInfoText.push(
            l10n.get('error_file', {file: moreInfo.filename},
              'File: {{file}}'));
        }
        if (moreInfo.lineNumber) {
          moreInfoText.push(
            l10n.get('error_line', {line: moreInfo.lineNumber},
              'Line: {{line}}'));
        }
      }
    }

    var errorWrapper = document.getElementById('errorWrapper');
    errorWrapper.removeAttribute('hidden');

    var errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;

    var closeButton = document.getElementById('errorClose');
    closeButton.onclick = function() {
      errorWrapper.setAttribute('hidden', 'true');
    };

    var errorMoreInfo = document.getElementById('errorMoreInfo');
    var moreInfoButton = document.getElementById('errorShowMore');
    var lessInfoButton = document.getElementById('errorShowLess');
    moreInfoButton.onclick = function() {
      errorMoreInfo.removeAttribute('hidden');
      moreInfoButton.setAttribute('hidden', 'true');
      lessInfoButton.removeAttribute('hidden');
      errorMoreInfo.style.height = errorMoreInfo.scrollHeight + 'px';
    };
    lessInfoButton.onclick = function() {
      errorMoreInfo.setAttribute('hidden', 'true');
      moreInfoButton.removeAttribute('hidden');
      lessInfoButton.setAttribute('hidden', 'true');
    };
    moreInfoButton.removeAttribute('hidden');
    lessInfoButton.setAttribute('hidden', 'true');
    Promise.all(moreInfoText).then(function (parts) {
      errorMoreInfo.value = parts.join('\n');
    });
  },

  // progress: function pdfViewProgress(level) {
  //   var percent = Math.round(level * 100);
  //   // Updating the bar if value increases.
  //   if (percent > this.loadingBar.percent || isNaN(percent)) {
  //     this.loadingBar.percent = percent;
  //   }
  // },

  get pagesCount() {
    return this.pdfDocument.numPages;
  },

  set page(val) {
    this.pdfViewer.currentPageNumber = val;
  },

  get page() {
    return this.pdfViewer.currentPageNumber;
  },

  zoomIn: function pdfViewZoomIn(ticks) {
    var newScale = this.pdfViewer.currentScale;
    do {
      newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
      newScale = Math.ceil(newScale * 10) / 10;
      newScale = Math.min(MAX_SCALE, newScale);
    } while (--ticks && newScale < MAX_SCALE);
    this.pdfViewer.currentScaleValue = newScale;
  },

  zoomOut: function pdfViewZoomOut(ticks) {
    var newScale = this.pdfViewer.currentScale;
    do {
      newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
      newScale = Math.floor(newScale * 10) / 10;
      newScale = Math.max(MIN_SCALE, newScale);
    } while (--ticks && newScale > MIN_SCALE);
    this.pdfViewer.currentScaleValue = newScale;
  },

  followPage: function pdfViewfollowPage(page){
    document.getElementById('pageNumber').innerHTML = `第 ${page} 页，共 ${this.pageTotal} 页`;
    document.getElementById('previous').disabled = (page <= 1);
    document.getElementById('next').disabled = (page >= this.pageTotal);
  },

  initUI: function pdfViewInitUI() {
    var linkService = new pdfjsViewer.PDFLinkService();
    this.pdfLinkService = linkService;

    this.l10n = pdfjsViewer.NullL10n;

    var container = document.getElementById('viewerContainer');
    var pdfViewer = new pdfjsViewer.PDFViewer({
      container: container,
      linkService: linkService,
      l10n: this.l10n,
      useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
      textLayerMode: TEXT_LAYER_MODE,
    });
    this.pdfViewer = pdfViewer;
    linkService.setViewer(pdfViewer);

    this.pdfHistory = new pdfjsViewer.PDFHistory({
      linkService: linkService
    });
    linkService.setHistory(this.pdfHistory);

    document.getElementById('previous').addEventListener('click', function() {
      PDFViewerApplication.page--;
    });

    document.getElementById('next').addEventListener('click', function() {
      PDFViewerApplication.page++;
    });

    document.getElementById('zoomIn').addEventListener('click', function() {
      PDFViewerApplication.zoomIn();
    });

    document.getElementById('zoomOut').addEventListener('click', function() {
      PDFViewerApplication.zoomOut();
    });

    document.getElementById('fullScreen').addEventListener('click', function() {
      if(!document.webkitIsFullScreen)
        document.body.webkitRequestFullscreen();
      else
        document.webkitExitFullscreen();
    });

    document.getElementById('print').addEventListener('click', function() {
      var pdfFile = window.open(window.source_url);
      pdfFile.print();
    });


    // document.getElementById('pageNumber').addEventListener('click', function() {
    //   this.select();
    // });

    // document.getElementById('pageNumber').addEventListener('change',
    //     function() {
    //   PDFViewerApplication.page = (this.value | 0);

    //   // Ensure that the page number input displays the correct value, even if the
    //   // value entered by the user was invalid (e.g. a floating point number).
    //   if (this.value !== PDFViewerApplication.page.toString()) {
    //     this.value = PDFViewerApplication.page;
    //   }
    // });

    container.addEventListener('pagesinit', function () {
      pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
      PDFViewerApplication.pageTotal = pdfViewer.pagesCount
      PDFViewerApplication.followPage(1);
    });

    container.addEventListener('pagechange', function (evt) {
      var page = evt.pageNumber;
      PDFViewerApplication.followPage(page);
      
    }, true);
  }
};

document.addEventListener('DOMContentLoaded', function () {
  PDFViewerApplication.initUI();
}, true);

(function animationStartedClosure() {
  // The offsetParent is not set until the PDF.js iframe or object is visible.
  // Waiting for first animation.
  PDFViewerApplication.animationStartedPromise = new Promise(
    function (resolve) {
      window.requestAnimationFrame(resolve);
    });
})();

// We need to delay opening until all HTML is loaded.
PDFViewerApplication.animationStartedPromise.then(function () {
  PDFViewerApplication.open({
    url: DEFAULT_URL
  });
});


document.body.onwebkitfullscreenchange = function(){
  var pdfViewer = PDFViewerApplication.pdfViewer
  if(document.webkitIsFullScreen){
    document.body.style.backgroundColor = '#252525'
    PDFViewerApplication.previousScale = pdfViewer.currentScaleValue;
    pdfViewer.currentScaleValue = 'page-fit';
  }
  else{
    document.body.style.backgroundColor = ''
    pdfViewer.currentScaleValue = PDFViewerApplication.previousScale;
  }
}