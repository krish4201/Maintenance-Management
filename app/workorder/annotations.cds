using WorkOrderService as service from '../../srv/workorder-service';
annotate service.WorkOrders with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : WorkOrderNo,
            },
            {
                $Type : 'UI.DataField',
                Label : 'EquipmentID',
                Value : EquipmentID,
            },
            {
                $Type : 'UI.DataField',
                Value : EquipmentName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'ProcedureID',
                Value : ProcedureID,
            },
            {
                $Type : 'UI.DataField',
                Value : ProcedureName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'AssignedTo',
                Value : AssignedTo,
            },
            {
                $Type : 'UI.DataField',
                Value : AssignedName,
            },
            {
                $Type : 'UI.DataField',
                Value : Priority,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Description',
                Value : Description,
            },
            {
                $Type : 'UI.DataField',
                Value : Status,
            },
            {
                $Type : 'UI.DataField',
                Label : 'CreatedBy',
                Value : CreatedBy,
            },
            {
                $Type : 'UI.DataField',
                Label : 'CreatedAt',
                Value : CreatedAt,
            },
            {
                $Type : 'UI.DataField',
                Label : 'DueDate',
                Value : DueDate,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
);

