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
                $( '.gtw-popup' ).remove();
                $( '.gtw-icon' ).remove();
                el.each( async (idx, item) => {
                    let sku = $( item ).text();
                    let warehouseData = await this.getWarehouseDataForSkus( sku, this.authToken, this.warehouses );
                    let parent = $( item ).closest( '.orderitem-holder > div:not( .ui-widget-header) > div' );
                    let allSkus = [ ...new Set(warehouseData.map( item => item.sku ) ) ];
                    let uniqueSkus = allSkus.filter( data => data !== sku );
                    $( item ).append( '<span class="gtw-icon" />' );
                    parent.append( '<div class="gtw-popup" />' );
                    let template = function(){
                        let createRows = data => {
                            return `
                                <div class="gtw-popup-row gtw-popup-row-data">
                                    <span>${ data.locationName }:</span>
                                    <span>${ data.onHand }</span>
                                    <span>${ data.available }</span>
                                    <span>${ data.inTransit }</span>
                                </div>
                            `;
                        }

                        let sectionRowHeader = ( text, skuString ) => {
                            return `<div class="gtw-popup-header"><strong>${text}${ skuString}</strong></div>`;
                        }

                        let masterSkuRowData = warehouseData.filter( data => data.sku === sku);
                        let masterSkuRows = masterSkuRowData.map( data => createRows( data ) );
                        let popupStrings = [];
                        if( masterSkuRows.length ){
                            popupStrings.push(
                                sectionRowHeader( 'Master SKU: ', sku ),
                                masterSkuRows.join('')
                            );
                        } else {
                            popupStrings.push( sectionRowHeader( 'No data for Master SKU: ', sku ) );
                        }
                        if( uniqueSkus.length ){
                            popupStrings.push( sectionRowHeader( 'COMPONENTS', '' ) );
                            uniqueSkus.forEach( skuID => {
                                let componentSkuRowData = warehouseData.filter( data => data.sku === skuID );
                                let componentSkuRow = componentSkuRowData.map( data => createRows( data ))
                                popupStrings.push(
                                    sectionRowHeader( 'Component SKU: ', skuID ),
                                    componentSkuRow.join('') );
                            });
                        }
                        return `
                            <div><strong>Inventory Details</strong></div>
                            <div class="gtw-popup-row">
                                <span></span>
                                <span>On Hand</span>
                                <span>Available</span>
                                <span>In Transit</span>
                            </div>
                            ${ popupStrings.join( '' ) }
                        `;
                    }
                    parent.find( '.gtw-popup' ).html( template() );
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
                    sku: masters
                },
                headers: {
                    Authorization : "Bearer " + authToken
                }
            };
            result = await ajax( data );
            let locations = result.map( location => {
                let locationId = location.stockLocation.warehouseId;
                let locationName = warehouses.find( warehouse => warehouse.warehouseId === locationId ).name;
                return {
                    sku          : location.product.masterSku,
                    locationName : locationName + ' (' + location.stockLocation.location + ')',
                    locationId   : locationId,
                    onHand       : location.warehouseStockTotals.onHandQuantity,
                    available    : location.warehouseStockTotals.availableQuantity,
                    inTransit    : location.warehouseStockTotals.inTransitQuantity,

                }
            });
            return locations;
        }

        return getListingsForMaster( masters, authToken, warehouses );
    }
}

// injectScript.authToken = `0a7c0955-3638-470e-949c-6590df0fcd32`;
