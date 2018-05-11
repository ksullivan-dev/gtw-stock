
let authTokenFromStorage = chrome.storage.sync.get('authToken', item => {
    checkToken( item.authToken );
    return item.authToken;
});

function checkToken( authToken, response ){
    let msg = '';
    if( authToken ){
        testAuth( authToken );
    } else {
        if( response ){
            msg = `That token didn't work. You entered: \n\n      ${response} \n\nTry again. `;
        }
        let auth = prompt( `${msg}Enter the token to access the Skubana API:` );
        if( auth ){
            testAuth( auth );
        } else {
            alert('In order to use this Chrome Extension, you will need the token to access the Skubana API. \n\nInventory Counts will not be available.');
        }
    }
}

function testAuth( token ){
    $.ajax({
        url: `https://app.skubana.com/service/v1/warehouses`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function( response ){
            chrome.storage.sync.set({ 'authToken': token });
            let injectScript = new InjectScript( token, response );
        },
        error: function( response ){
            chrome.storage.sync.remove('authToken');
            checkToken( null, token );
        }
    });
}
