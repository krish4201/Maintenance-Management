using { equipment } from './external/equipment';

service EquipmentServiceAPI @(requires : 'authenticated-user'){

    entity Equipments
    as projection on equipment.ZC_MASTER_EQUIPMENT;

}
