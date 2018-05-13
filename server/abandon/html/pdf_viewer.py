html = '''<!DOCTYPE html>
<!--
Copyright 2016 Mozilla Foundation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<html dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

    <title>PDF.js viewer</title>

    <link rel="stylesheet" type="text/css" href="/static/pdf.js/pdf_viewer.css">
    <link rel="stylesheet" type="text/css" href="/static/pdf.js/viewer.css">

    <script src="/static/pdf.js/pdf.min.js"></script>
    <script src="/static/pdf.js/pdf_viewer.js"></script>
    <script type="text/javascript">
      window.release_url = '{release_url}';
      window.print_url = '{source_url}';
    </script>
  </head>

  <body>
    <div id="viewerContainer">
      <div id="viewer" class="pdfViewer"></div>
    </div>

    <div id="errorWrapper" hidden="true">
      <div id="errorMessageLeft">
        <span id="errorMessage"></span>
        <button id="errorShowMore">
          More Information
        </button>
        <button id="errorShowLess">
          Less Information
        </button>
      </div>
      <div id="errorMessageRight">
        <button id="errorClose">
          Close
        </button>
      </div>
      <div class="clearBoth"></div>
      <textarea id="errorMoreInfo" hidden="true" readonly="readonly"></textarea>
    </div>

    <footer>
      <toolbar>
        <div id="pageNumber" class="toolbarField pageNumber">第 N 页，共 N 页</div>
        <button class="toolbarButton zoomOut" title="Zoom Out" id="zoomOut"><icon></icon></button>
        <button class="toolbarButton zoomIn" title="Zoom In" id="zoomIn"><icon></icon></button>
        <button class="toolbarButton pageUp" title="Previous Page" id="previous"><icon></icon></button>
        <button class="toolbarButton pageDown" title="Next Page" id="next"><icon></icon></button>
        <button class="toolbarButton fullScreen" title="Full Screen" id="fullScreen"><icon></icon></button>
        <button class="toolbarButton print" title="Print" id="print"><icon></icon></button>
      </toolbar>
    </footer>

     <script src="/static/pdf.js/viewer.js"></script>
  </body>
</html>'''
