
using { workorder } from './external/workorder';

service WorkOrderService @(requires: 'authenticated-user') {


    entity WorkOrders    as projection on workorder.WorkOrders;


    entity StatusHistory as projection on workorder.StatusHistory;

    action assignTechnician(workOrderNo: String,
                            technicianId: String,
                            technicianName: String);


    action updateStatus(workOrderNo: String,
                        status: String);

    action startWork(workOrderNo: String);


    action completeWork(workOrderNo: String);

}
