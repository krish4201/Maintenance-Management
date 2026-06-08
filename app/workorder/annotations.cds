using WorkOrderService as service from '../../srv/workorder-service';

annotate service.WorkOrders with {
    WorkOrderNo   @Common.Label : 'Work Order';
    EquipmentID   @Common.Label : 'Equipment ID';
    EquipmentName @Common.Label : 'Equipment';
    ProcedureID   @Common.Label : 'Procedure ID';
    MaintenanceType @Common.Label : 'Maintenance Type';
    ProcedureName @Common.Label : 'Procedure';
    AssignedTo    @Common.Label : 'Technician ID';
    AssignedName  @Common.Label : 'Technician';
    Priority      @Common.Label : 'Priority';
    Description   @Common.Label : 'Description';
    Status        @Common.Label : 'Status';
    CreatedBy     @Common.Label : 'Created By';
    CreatedAt     @Common.Label : 'Created On';
};

annotate service.WorkOrders with @(
    UI.HeaderInfo : {
        TypeName       : 'Work Order',
        TypeNamePlural : 'Work Orders',
        Title          : { Value : WorkOrderNo },
        Description    : { Value : EquipmentName }
    },
    UI.SelectionFields : [
        Status,
        Priority,
        MaintenanceType,
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Work Order',
            Value : WorkOrderNo
        },
        {
            $Type : 'UI.DataField',
            Label : 'Equipment',
            Value : EquipmentName
        },
        {
            $Type : 'UI.DataField',
            Label : 'Procedure ID',
            Value : ProcedureID
        },
        {
            $Type : 'UI.DataField',
            Label : 'Maintenance Type',
            Value : MaintenanceType
        },
        {
            $Type : 'UI.DataField',
            Label : 'Priority',
            Value : Priority
        },
        {
            $Type : 'UI.DataField',
            Label : 'Status',
            Value : Status
        },
        {
            $Type : 'UI.DataField',
            Label : 'Technician',
            Value : AssignedName
        }
    ],
    UI.FieldGroup #Planning : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : WorkOrderNo },
            { $Type : 'UI.DataField', Value : Priority },
            { $Type : 'UI.DataField', Value : Status },
            { $Type : 'UI.DataField', Value : MaintenanceType }
        ]
    },
    UI.FieldGroup #Equipment : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : EquipmentID },
            { $Type : 'UI.DataField', Value : EquipmentName },
            { $Type : 'UI.DataField', Value : ProcedureID }
        ]
    },
    UI.FieldGroup #Assignment : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : AssignedTo },
            { $Type : 'UI.DataField', Value : AssignedName },
            { $Type : 'UI.DataField', Value : CreatedBy },
            { $Type : 'UI.DataField', Value : CreatedAt }
        ]
    },
    UI.Facets : [
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'Planning',
            Label  : 'Planning',
            Target : '@UI.FieldGroup#Planning'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'Equipment',
            Label  : 'Equipment and Procedure',
            Target : '@UI.FieldGroup#Equipment'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'Assignment',
            Label  : 'Assignment',
            Target : '@UI.FieldGroup#Assignment'
        }
    ]
);
