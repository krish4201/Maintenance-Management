using WorkOrderService from './workorder-service';

annotate WorkOrderService.startWork with @UI.DataFieldForAction : {
    Label : 'Start Work'
};

annotate WorkOrderService.completeWork with @UI.DataFieldForAction : {
    Label : 'Complete Work'
};

annotate WorkOrderService.assignTechnician with @UI.DataFieldForAction : {
    Label : 'Assign Technician'
};
