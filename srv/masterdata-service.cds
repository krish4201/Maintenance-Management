using { EquipmentServiceAPI } from './equipment-service';
using { ProcedureServiceAPI } from './procedure-service';

service MasterDataService @(requires : 'authenticated-user'){

    entity Equipments
    as projection on EquipmentServiceAPI.Equipments;

    entity Procedures
    as projection on ProcedureServiceAPI.Procedures;

}