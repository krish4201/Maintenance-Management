sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"maintenance/equipment/equipment/test/integration/pages/EquipmentsList",
	"maintenance/equipment/equipment/test/integration/pages/EquipmentsObjectPage"
], function (JourneyRunner, EquipmentsList, EquipmentsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('maintenance/equipment/equipment') + '/test/flp.html#app-preview',
        pages: {
			onTheEquipmentsList: EquipmentsList,
			onTheEquipmentsObjectPage: EquipmentsObjectPage
        },
        async: true
    });

    return runner;
});

