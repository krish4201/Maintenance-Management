using maintenance from '../db/schema';

service WorkOrderService @(requires: 'authenticated-user') {


    entity WorkOrders    as projection on maintenance.WorkOrders;


    entity StatusHistory as projection on maintenance.StatusHistory;

    action assignTechnician(workOrderNo: String,
                            technicianId: String,
                            technicianName: String);


    action updateStatus(workOrderNo: String,
                        status: String);

    action startWork(workOrderNo: String);


    action completeWork(workOrderNo: String);

}
