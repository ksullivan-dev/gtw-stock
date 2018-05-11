class InjectScript {
    constructor( token, warehouses ) {
        // console.clear();
        console.log( '***** Content Script ******' );
        console.log("InjectScript loaded");
        this.authToken = token;
        this.warehouses = warehouses;
        this.registerEventHandlers();
    }
    registerEventHandlers() {
        // Listener for successful new order loaded request
        chrome.runtime.onMessage.addListener( async request => {
            if( request.newOrderLoaded ){
                let el = $( '#orderItems span.internalSku' );
                let skus = Array.from( el ).map( item => $( item ).text() );
                let warehouseData = await this.getWarehouseDataForSkus( skus, this.authToken, this.warehouses );
                el.find( '.gtw-popup' ).remove();
                el.find( '.gtw-icon' ).remove();
                el.each( (idx, item) => {
                    $( item ).append( '<span class="gtw-icon" />' );
                    $( item ).append( '<div class="gtw-popup" />' );
                    let template = function(){
                        let sku = $( item ).text();
                        let dataToUse = warehouseData.filter( data => data.sku === sku );
                        let popupStrings = dataToUse.map( data => {
                            return `
                                <div class="gtw-popup-row">
                                    <span>${ data.locationName }:</span>
                                    <span>${ data.onHand }</span>
                                    <span>${ data.available }</span>
                                    <span>${ data.inTransit }</span>
                                </div>
                            `;
                        });
                        return `
                            <div><strong>Master Sku: ${ sku }</strong></div>
                            <div class="gtw-popup-row">
                                <span></span>
                                <span>On Hand</span>
                                <span>Available</span>
                                <span>In Transit</span>
                            </div>
                            ${ popupStrings.join( '' ) }
                        `;
                    }
                    $( item ).find( '.gtw-popup' ).html( template() );
                });
            }
        });
    }
    getWarehouseDataForSkus( masters, authToken, warehouses ){
        async function getListingsForMaster( masters, authToken, warehouses ){
            let data, result;
            data = {
                url: "https://app.skubana.com/service/v1/inventory",
                data: {
                    sku: masters.join( ',' )
                },
                headers: {
                    Authorization : "Bearer " + authToken
                }
            };
            result = await ajax( data );
            let locations = result.map( location => {
                let locationId = location.stockLocation.warehouseId;
                let locationName = warehouses.find( warehouse => warehouse.warehouseId === locationId ).name;
                let sku = masters.find( master => master === location.product.masterSku );
                return {
                    locationId   : locationId,
                    locationName : locationName + ' (' + location.stockLocation.location + ')',
                    onHand       : location.warehouseStockTotals.onHandQuantity,
                    available    : location.warehouseStockTotals.availableQuantity,
                    inTransit    : location.warehouseStockTotals.inTransitQuantity,
                    sku          : sku
                }
            });
            return locations;
        }

        return getListingsForMaster( masters, authToken, warehouses );
    }
}

// injectScript.authToken = `0a7c0955-3638-470e-949c-6590df0fcd32`;
