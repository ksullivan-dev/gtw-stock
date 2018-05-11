console.log( "*** Background page ***" );

chrome.webRequest.onCompleted.addListener(
    function( details ){
        if( details && details.statusCode === 200 ){
            console.log( 'successful request to load new order' );
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if( details.url.indexOf( 'getitems' ) > -1 ){
                    chrome.tabs.sendMessage( tabs[0].id, { newOrderLoaded: true } );
                }
            });
        }

    },
    {urls: ["*://app.skubana.com/work/orders/getitems*"]},
    []
);
