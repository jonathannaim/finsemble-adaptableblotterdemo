var demoHelper = require('../../demohelper');

if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener('onReady', init);
} else {
	window.addEventListener('FSBLReady', init);
}

function init() {

	FSBL.Clients.WindowClient.setWindowTitle("Position Blotter");
	FSBL.Clients.RouterClient.query("Positions", null, function (error, response) {
		if (!error) {
			console.log("Positions Response: " + JSON.stringify(response));
			//we create the hypergrid with the received data
			let hypergrid = demoHelper.createGrid(response.data, "position");
			setupEditorsAndFormats(hypergrid);
			//we use the window generated name as the blotterId
			let adaptableBlotter = demoHelper.initAdaptableBlotter(hypergrid, "Positions", "instrumentId");
			let demoDataObject = new demoHelper.DemoDataObject();
			demoHelper.maximizeWidgetWhenABPopupVisible(adaptableBlotter, demoDataObject);
			// demoHelper.publishInstrumentExpressionWhenChanged(adaptableBlotter, demoDataObject);
			demoHelper.publishQuickSearchWhenChanged(adaptableBlotter, demoDataObject);
			demoHelper.hypergridThemeChangeWhenAbChange(adaptableBlotter, hypergrid, demoDataObject);
			demoHelper.publishSymbolWhenSelectionChanged(hypergrid, demoDataObject);
			demoHelper.setEmittersWhenSelectionChanged(hypergrid, adaptableBlotter);
			console.log('Received initial list of positions');
			FSBL.Clients.RouterClient.addListener("UpdatePosition", function (error, response) {
				if (error) {
					console.log("UpdatePosition Error: " + JSON.stringify(error));
				} else {
					demoHelper.hypergridUpdateRowFromDataSource(hypergrid, adaptableBlotter, response.data, adaptableBlotter.BlotterOptions.primaryKey);
					console.log("UpdatePosition Response: " + JSON.stringify(response));
				}
			});
			//we update our filters when some other blotter publish a new Filter Expression on instrumentId
			// FSBL.Clients.LinkerClient.subscribe("instrumentExpression", function (obj) {
			// 	if (obj) {
			// 		demoDataObject.currentFilters = adaptableBlotter.AdaptableBlotterStore.TheStore.dispatch({
			// 			type: 'COLUMN_FILTER_ADD_UPDATE',
			// 			columnFilter: obj
			// 		});
			// 	}
			// 	else {
			// 		adaptableBlotter.AdaptableBlotterStore.TheStore.dispatch({
			// 			type: 'COLUMN_FILTER_DELETE',
			// 			columnFilter: {
			// 				ColumnId: "instrumentId"
			// 			}
			// 		});
			// 	}
			//we want to ignore the first triggers from other components... cant be bothered to do it properly so just subscribing to the topic after 5 sec
			setTimeout(() => {
				FSBL.Clients.LinkerClient.subscribe("quickSearch", function (quickSearch) {
					if (demoDataObject.currentQuickSearch !== quickSearch) {
						adaptableBlotter.api.quickSearchApi.Apply(quickSearch)
					}
				});
				FSBL.Clients.LinkerClient.subscribe("symbol", function (symbol) {
					if (demoDataObject.currentSelectedSymbol !== symbol) {
						adaptableBlotter.api.quickSearchApi.Apply(symbol)
					}
				});
			}, 5000);
		}
	});

};

function setupEditorsAndFormats(hypergrid) {
	//format postition
	hypergrid.behavior.setColumnProperties(1, {
		format: 'USDCurrencyFormat'
	});
	//format pnl
	hypergrid.behavior.setColumnProperties(5, {
		format: 'USDCurrencyFormat'
	});
}