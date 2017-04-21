<!doctype html>
<html lang="en">
<head>
    <title>Epistles of Paul</title>
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <link rel="shortcut icon"type="image/x-icon" href="data:image/x-icon;," />

    <script type="text/javascript" src="https://code.jquery.com/jquery-2.2.4.min.js"></script>


    <?php if ( false ) { ?>
    <script src="https://unpkg.com/leaflet@1.0.3/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.0.3/dist/leaflet.css" />

    <link rel="stylesheet" href="https://unpkg.com/leaflet-easybutton@2.0.0/src/easy-button.css">
    <script src="https://unpkg.com/leaflet-easybutton@2.0.0/src/easy-button.js"></script>
    <?php } ?>

    <script src="https://unpkg.com/sticky-kit@1.1.3/dist/sticky-kit.js"></script>

    <?php if ( false ) { ?>
    <script type="text/javascript" src="//kartena.github.io/Leaflet.Pancontrol/lib/Leaflet.Pancontrol/src/L.Control.Pan.js"></script>
    <link rel="stylesheet" type="text/css" href="//kartena.github.io/Leaflet.Pancontrol/lib/Leaflet.Pancontrol/src/L.Control.Pan.css" />
    <?php } ?>

    <link rel="stylesheet" type="text/css" href="./assets/stylesheets/main.css?_=<?php echo microtime(true) ?>" />
    <script type="text/javascript" src="./assets/javascripts/main.js?_=<?php echo microtime(true) ?>"></script>

    <link href='https://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,600,600italic,700,700italic,800,800italic' rel='stylesheet' type='text/css' />
    <link href='https://fonts.googleapis.com/css?family=PT+Serif:400,400italic,700,700italic' rel='stylesheet' type='text/css' />

    <script src="https://use.fontawesome.com/7b7d9e1e53.js"></script>

</head>
<body>

    <header class="pages pages--home pages--help">
      <div class="site-header">
        <div class="container-fluid">
          <a href="http://umich.edu" class="site-brand-umich-block-m-logo">
            <img src="assets/images/umich_block_m.png" alt="Go to the University of Michigan homepage">
          </a>
          <a href="http://lib.umich.edu" class="site-brand-mlibrary-logo">
            <img src="assets/images/mlibrary_logo.png" alt="Go to the University of Michigan Library homepage">
          </a>
          <nav class="navigation right">
            <ul class="navigation-list">
              <li>
                <a href="http://www.lib.umich.edu/papyrus-collection" class="white-text">Papyrology Collection</a>
              </li>
              <li>
                <a href="http://quod.lib.umich.edu/" class="white-text">MLibrary Collections</a>
              </li>
            </ul>
          </nav>
          <div class="clearfix"></div>
        </div>
      </div>
    </header>

    <div id="announce" class="offscreen" aria-live="polite"></div>

    <div class="pages pages--home pages-for-text pages-max-height pages-max-width">
        <div class="container">
            <h1 class="no-margin" aria-live="polite">The Epistles of Paul</h1>

            <p>
                <a href="#" class="button action-page" data-target="viewer"><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 28' height="1.25rem" fill="white"><path d='M21.625 14.484l-20.75 11.531c-0.484 0.266-0.875 0.031-0.875-0.516v-23c0-0.547 0.391-0.781 0.875-0.516l20.75 11.531c0.484 0.266 0.484 0.703 0 0.969z'></path></svg> Start</a>
                &nbsp;
                <a href="#" class="button button-light action-page" data-target="help"><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 17 28' height="1.25rem"><path d='M11 19.625v3.75c0 0.344-0.281 0.625-0.625 0.625h-3.75c-0.344 0-0.625-0.281-0.625-0.625v-3.75c0-0.344 0.281-0.625 0.625-0.625h3.75c0.344 0 0.625 0.281 0.625 0.625zM15.937 10.25c0 2.969-2.016 4.109-3.5 4.937-0.922 0.531-1.5 1.609-1.5 2.063v0c0 0.344-0.266 0.75-0.625 0.75h-3.75c-0.344 0-0.562-0.531-0.562-0.875v-0.703c0-1.891 1.875-3.516 3.25-4.141 1.203-0.547 1.703-1.062 1.703-2.063 0-0.875-1.141-1.656-2.406-1.656-0.703 0-1.344 0.219-1.687 0.453-0.375 0.266-0.75 0.641-1.672 1.797-0.125 0.156-0.313 0.25-0.484 0.25-0.141 0-0.266-0.047-0.391-0.125l-2.562-1.953c-0.266-0.203-0.328-0.547-0.156-0.828 1.687-2.797 4.062-4.156 7.25-4.156 3.344 0 7.094 2.672 7.094 6.25z'></path></svg> Help</a>
            </p>

            <p>
                Welcome to the world of second century C.E. Egypt. This app 
                will allow you to leaf through pages of the world's oldest
                existing manuscript of the letters of St. Paul (P.Mich inv. 6238,
                also known in New Testament scholarship as P46). Thirty leaves
                of this manuscript, written in about 200 C.E., were found in Egypt
                and purchased by the University of Michigan Papyrology Collection 
                in 1931 and 1933 (another 56 leaves, not included in this app,
                are found in the Chester Beatty Library, Dublin; 18 leaves 
                are missing completely).
            </p>
            <p>
                This app will give you the feel of what it was like reading an
                ancient Greek book on papyrus where the text is written
                without word division, punctuation, headings, or chapter and
                verse numbers. To aid the reader without knowldge of ancient
                Greek the translation mode will give a literal translation of the
                Greek text preserved on these pages (with addiiton of chapter 
                and verse numbers), with explanatory notes showing where this
                text is different from the Standard text.
            </p>

        </div>
    </div>

    <div class="pages pages--viewer hidden">
        <h1 class="offscreen" aria-live="polite"></h1>

        <div class="panels--wrap" id="stickable">
            <div class="panels--scan">
                <button id="action-reveal-info" role="button"><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 28' height="3rem"><path d='M16 21.5v-2.5c0-0.281-0.219-0.5-0.5-0.5h-1.5v-8c0-0.281-0.219-0.5-0.5-0.5h-5c-0.281 0-0.5 0.219-0.5 0.5v2.5c0 0.281 0.219 0.5 0.5 0.5h1.5v5h-1.5c-0.281 0-0.5 0.219-0.5 0.5v2.5c0 0.281 0.219 0.5 0.5 0.5h7c0.281 0 0.5-0.219 0.5-0.5zM14 7.5v-2.5c0-0.281-0.219-0.5-0.5-0.5h-3c-0.281 0-0.5 0.219-0.5 0.5v2.5c0 0.281 0.219 0.5 0.5 0.5h3c0.281 0 0.5-0.219 0.5-0.5zM24 14c0 6.625-5.375 12-12 12s-12-5.375-12-12 5.375-12 12-12 12 5.375 12 12z'></path></svg><span class="offscreen">Show Page Information</span></button>
                <button id="action-reveal-scan" role="button"><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 28' height="3rem"><path d='M17.141 16.859l-2.281 2.281c-0.203 0.203-0.516 0.203-0.719 0l-2.141-2.141-2.141 2.141c-0.203 0.203-0.516 0.203-0.719 0l-2.281-2.281c-0.203-0.203-0.203-0.516 0-0.719l2.141-2.141-2.141-2.141c-0.203-0.203-0.203-0.516 0-0.719l2.281-2.281c0.203-0.203 0.516-0.203 0.719 0l2.141 2.141 2.141-2.141c0.203-0.203 0.516-0.203 0.719 0l2.281 2.281c0.203 0.203 0.203 0.516 0 0.719l-2.141 2.141 2.141 2.141c0.203 0.203 0.203 0.516 0 0.719zM20.5 14c0-4.688-3.813-8.5-8.5-8.5s-8.5 3.813-8.5 8.5 3.813 8.5 8.5 8.5 8.5-3.813 8.5-8.5zM24 14c0 6.625-5.375 12-12 12s-12-5.375-12-12 5.375-12 12-12 12 5.375 12 12z'></path></svg><span class="offscreen">Show Page Scan</span></button>
                <div class="panels--scan--viewer"></div>
                <div class="translation-container invisible" id="annotation">
                  <p class="translation-text"></p>
                </div>
            </div>
            <div class="panels--text">
                <div class="panels--inner" data-box="true">
                    <pre>RIGHT SIDE</pre>
                </div>
            </div>
            <button id="action-go-previous" class="action-go-page" data-delta="-1" role="button"><span class="offscreen">Previous page</span></button>
            <button id="action-go-next" class="action-go-page" data-delta="1" role="button"><span class="offscreen">Next page</span></button>
        </div>
        <div class="panels--wrap">
            <div class="panels--metadata">
                <div class="panels--inner">
                </div>
            </div>
        </div>

    </div>

    <div class="pages pages--help pages-for-text pages-max-height pages-max-width hidden">
        <div class="container">
            <h1 class="no-margin" aria-live="polite">Help Guide</h1>
            <p>
                <a href="#" class="button button-light action-page"><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28' height="1.25rem"><path d='M25.297 2.203c0.391-0.391 0.703-0.25 0.703 0.297v23c0 0.547-0.313 0.688-0.703 0.297l-11.094-11.094c-0.094-0.094-0.156-0.187-0.203-0.297v11.094c0 0.547-0.313 0.688-0.703 0.297l-11.094-11.094c-0.391-0.391-0.391-1.016 0-1.406l11.094-11.094c0.391-0.391 0.703-0.25 0.703 0.297v11.094c0.047-0.109 0.109-0.203 0.203-0.297z'></path></svg> Back</a>
            </p>
            <p>
                In the image viewer page, you can zoom in/out on the image (use the +/- icons) and/or move around by clicking and dragging.
            </p>
            <p>
                You can toggle overlaying annotations on top of the image; as you hover over an annotation, the appropriate 
                line in the translation will be revealed.
            </p>
            <p>
                Some translations have footnote markers; you can activate the marker to pop up explanatory notes.
            </p>
            <p>
                More information about the scan is revealed when you use the information button.
            </p>
        </div>
    </div>

</body>
</html>