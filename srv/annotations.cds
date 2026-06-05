// annotate WorkOrderService.WorkOrders with {

//     EquipmentID
//     @Common.ValueList: {

//         CollectionPath : 'Equipments',

//         Parameters : [

//             {
//                 $Type :
//                 'Common.ValueListParameterInOut',

//                 LocalDataProperty :
//                 EquipmentID,

//                 ValueListProperty :
//                 'EquipmentID'
//             },

//             {
//                 $Type :
//                 'Common.ValueListParameterDisplayOnly',

//                 ValueListProperty :
//                 'EquipmentName'
//             }
//         ]
//     };

// };

using WorkOrderService from './workorder-service';

annotate WorkOrderService.WorkOrders with {

    WorkOrderNo @title : 'Work Order';

    EquipmentName @title : 'Equipment';

    ProcedureName @title : 'Procedure';

    AssignedName @title : 'Assigned To';

    Status @title : 'Status';

    Priority @title : 'Priority';

};

annotate WorkOrderService.WorkOrders with @UI.LineItem: [

{
    Value : WorkOrderNo
},

{
    Value : EquipmentName
},

{
    Value : ProcedureName
},

{
    Value : AssignedName
},

{
    Value : Status
},

{
    Value : Priority
}

];

annotate WorkOrderService.WorkOrders with @UI.SelectionFields: [

    EquipmentName,
    Status,
    Priority

];

annotate WorkOrderService.WorkOrders with @UI.FieldGroup #General: {

    Data: [

        {
            Value: WorkOrderNo
        },

        {
            Value: EquipmentName
        },

        {
            Value: ProcedureName
        },

        {
            Value: Description
        }

    ]

};

annotate WorkOrderService.WorkOrders with @UI.HeaderInfo: {

    TypeName : 'Work Order',

    TypeNamePlural : 'Work Orders',

    Title : {
        Value : WorkOrderNo
    },

    Description : {
        Value : EquipmentName
    }

};
annotate WorkOrderService.startWork with  @UI.DataFieldForAction : {
        Label : 'Start Work'
    };
annotate WorkOrderService.completeWork with @UI.DataFieldForAction : {
        Label : 'Complete Work'
    };

annotate WorkOrderService.assignTechnician with @UI.DataFieldForAction : {

        Label : 'Assign Technician'

    };
