using EquipmentServiceAPI as service from '../../srv/equipment-service';
annotate service.Equipments with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'equipment_id',
                Value : equipment_id,
            },
            {
                $Type : 'UI.DataField',
                Label : 'equipment_name',
                Value : equipment_name,
            },
            {
                $Type : 'UI.DataField',
                Label : 'equipment_type',
                Value : equipment_type,
            },
            {
                $Type : 'UI.DataField',
                Label : 'manufacturer',
                Value : manufacturer,
            },
            {
                $Type : 'UI.DataField',
                Label : 'model_number',
                Value : model_number,
            },
            {
                $Type : 'UI.DataField',
                Label : 'serial_number',
                Value : serial_number,
            },
            {
                $Type : 'UI.DataField',
                Label : 'location',
                Value : location,
            },
            {
                $Type : 'UI.DataField',
                Label : 'installation_date',
                Value : installation_date,
            },
            {
                $Type : 'UI.DataField',
                Label : 'last_maintenance',
                Value : last_maintenance,
            },
            {
                $Type : 'UI.DataField',
                Label : 'last_maintained_by',
                Value : last_maintained_by,
            },
            {
                $Type : 'UI.DataField',
                Label : 'status',
                Value : status,
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
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'equipment_id',
            Value : equipment_id,
        },
        {
            $Type : 'UI.DataField',
            Label : 'equipment_name',
            Value : equipment_name,
        },
        {
            $Type : 'UI.DataField',
            Label : 'equipment_type',
            Value : equipment_type,
        },
        {
            $Type : 'UI.DataField',
            Label : 'manufacturer',
            Value : manufacturer,
        },
        {
            $Type : 'UI.DataField',
            Label : 'model_number',
            Value : model_number,
        },
    ],
);

