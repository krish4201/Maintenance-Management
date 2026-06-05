using { procedure } from './external/procedure';

service ProcedureServiceAPI @(requires : 'authenticated-user') {

    entity Procedures
    as projection on procedure.ZI_MAINT_PROC;
}