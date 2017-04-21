/**
 * modalEffects.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
var ModalEffects = (function() {

    function init() {

        var overlay = document.querySelector( '.md-overlay' );

        [].slice.call( document.querySelectorAll( '.md-trigger' ) ).forEach( function( el, i ) {

            var modal = document.querySelector( '#' + el.getAttribute( 'data-modal' ) ),
                close = modal.querySelector( '.md-close' );

            function removeModal( hasPerspective ) {
                classie.remove( modal, 'md-show' );

                if( hasPerspective ) {
                    classie.remove( document.documentElement, 'md-perspective' );
                }
            }

            function removeModalHandler() {
                removeModal( classie.has( el, 'md-setperspective' ) ); 
            }

            el.addEventListener( 'click', function( ev ) {
                var target = ev.target;

                classie.add( modal, 'md-show' );
                overlay.removeEventListener( 'click', removeModalHandler );
                overlay.addEventListener( 'click', removeModalHandler );

                console.log(target.dataset);
                if ( target.dataset.target ) {
                    var bounds = target.getBoundingClientRect();
                    var left = bounds.left + 50;
                    var top = bounds.bottom + 10;
                    var height = 255;
                    // console.log("AHOY", top, height, bounds.top, bounds.bottom,  $viewer.height());
                    if ( top + height > window.outerHeight ){
                      // back it up
                      console.log("BACKING IT UP");
                      top = bounds.top - height - 25;
                    }
                    modal.style.top = target.offsetTop + top + 'px';
                    modal.style.left = target.offsetLeft + left + 'px';
                    console.log("AHOY DIALOG", target, top, left);
                } else {
                    modal.style.top = null;
                    modal.style.left = null;
                }

                if( classie.has( el, 'md-setperspective' ) ) {
                    setTimeout( function() {
                        classie.add( document.documentElement, 'md-perspective' );
                    }, 25 );
                }
            });

            close.addEventListener( 'click', function( ev ) {
                ev.stopPropagation();
                removeModalHandler();
            });

        } );

    }

    init();

})();
