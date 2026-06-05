namespace maintenance;

type Status : String enum {
    Created;
    Assigned;
    InProgress;
    Completed;
    Closed;
    Cancelled;
}

entity WorkOrders {

    key ID            : UUID;

    WorkOrderNo       : String(20);

    EquipmentID       : String(30);

    EquipmentName     : String(100);

    ProcedureID       : String(30);

    ProcedureName     : String(100);

    AssignedTo        : String(50);

    AssignedName      : String(100);

    Priority          : String(20);

    Description       : String(500);

    Status            : Status;

    CreatedBy         : String(50);

    CreatedAt         : Timestamp;

    DueDate           : Date;
}

entity StatusHistory {

    key ID            : UUID;

    WorkOrderNo       : String(20);

    OldStatus         : String(30);

    NewStatus         : String(30);

    ChangedBy         : String(50);

    ChangedAt         : Timestamp;
}