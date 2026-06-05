using { equipment } from './external/equipment';

service EquipmentServiceAPI @(requires : 'authenticated-user'){

    @restrict: [
        {
            grant: 'READ',
            to   : [
                'Planner',
                'Supervisor'
            ]
        },
        {
            grant: 'CREATE',
            to   : 'Supervisor'
        }
    ]
    entity Equipments
    as projection on equipment.ZC_MASTER_EQUIPMENT;

}
