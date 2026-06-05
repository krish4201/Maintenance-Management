sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"maintenance/workorder/workorder/test/integration/pages/WorkOrdersList",
	"maintenance/workorder/workorder/test/integration/pages/WorkOrdersObjectPage"
], function (JourneyRunner, WorkOrdersList, WorkOrdersObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('maintenance/workorder/workorder') + '/test/flp.html#app-preview',
        pages: {
			onTheWorkOrdersList: WorkOrdersList,
			onTheWorkOrdersObjectPage: WorkOrdersObjectPage
        },
        async: true
    });

    return runner;
});

