using maintenance from '../db/schema';

service WorkOrderService @(requires: 'authenticated-user') {


    @restrict: [
        {
            grant: 'CREATE',
            to   : [
                'Planner',
                'Supervisor'
            ]
        },
        {
            grant: 'READ',
            to   : [
                'Planner',
                'Supervisor',
                'Technician'
            ]
        },
        {
            grant: 'UPDATE',
            to   : 'Supervisor'
        }
    ]
    entity WorkOrders    as projection on maintenance.WorkOrders;


    entity StatusHistory as projection on maintenance.StatusHistory;

    @restrict: [{
        grant: 'EXECUTE',
        to   : 'Supervisor'
    }]
    action assignTechnician(workOrderNo: String,
                            technicianId: String,
                            technicianName: String);


    action updateStatus(workOrderNo: String,
                        status: String);

    @restrict: [{
        grant: 'EXECUTE',
        to   : 'Technician'
    }]
    action startWork(workOrderNo: String);


    @restrict: [{
        grant: 'EXECUTE',
        to   : 'Technician'
    }]
    action completeWork(workOrderNo: String);

}
