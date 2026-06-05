using EquipmentServiceAPI as service from '../../srv/equipment-service';

annotate service.Equipments with {
    equipment_id       @Common.Label : 'Equipment ID';
    equipment_name     @Common.Label : 'Equipment';
    equipment_type     @Common.Label : 'Type';
    manufacturer       @Common.Label : 'Manufacturer';
    model_number       @Common.Label : 'Model';
    serial_number      @Common.Label : 'Serial Number';
    location           @Common.Label : 'Location';
    installation_date  @Common.Label : 'Installation Date';
    last_maintenance   @Common.Label : 'Last Maintenance';
    last_maintained_by @Common.Label : 'Last Maintained By';
    status             @Common.Label : 'Status';
};

annotate service.Equipments with @(
    UI.HeaderInfo : {
        TypeName       : 'Equipment',
        TypeNamePlural : 'Equipment',
        Title          : { Value : equipment_name },
        Description    : { Value : equipment_id }
    },
    UI.SelectionFields : [
        status,
        equipment_type,
        manufacturer,
        location
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Equipment',
            Value : equipment_name
        },
        {
            $Type : 'UI.DataField',
            Label : 'Equipment ID',
            Value : equipment_id
        },
        {
            $Type : 'UI.DataField',
            Label : 'Type',
            Value : equipment_type
        },
        {
            $Type : 'UI.DataField',
            Label : 'Location',
            Value : location
        },
        {
            $Type : 'UI.DataField',
            Label : 'Status',
            Value : status
        },
        {
            $Type : 'UI.DataField',
            Label : 'Last Maintenance',
            Value : last_maintenance
        }
    ],
    UI.FieldGroup #Identity : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : equipment_id },
            { $Type : 'UI.DataField', Value : equipment_name },
            { $Type : 'UI.DataField', Value : equipment_type },
            { $Type : 'UI.DataField', Value : status }
        ]
    },
    UI.FieldGroup #Manufacturing : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : manufacturer },
            { $Type : 'UI.DataField', Value : model_number },
            { $Type : 'UI.DataField', Value : serial_number },
            { $Type : 'UI.DataField', Value : installation_date }
        ]
    },
    UI.FieldGroup #Maintenance : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : location },
            { $Type : 'UI.DataField', Value : last_maintenance },
            { $Type : 'UI.DataField', Value : last_maintained_by }
        ]
    },
    UI.Facets : [
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'Identity',
            Label  : 'Identity',
            Target : '@UI.FieldGroup#Identity'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'Manufacturing',
            Label  : 'Manufacturing',
            Target : '@UI.FieldGroup#Manufacturing'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            ID     : 'Maintenance',
            Label  : 'Maintenance',
            Target : '@UI.FieldGroup#Maintenance'
        }
    ]
);
