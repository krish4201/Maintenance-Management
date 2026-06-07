type DashboardSummary {
    totalWorkOrders : Integer;
    openWorkOrders  : Integer;
    assignedOrders  : Integer;
    unassignedOrders : Integer;
    completedOrders : Integer;
    equipmentCount  : Integer;
    procedureCount  : Integer;
}

type ChartData {
    label : String;
    value : Integer;
}

service DashboardService @(requires: 'authenticated-user') {
    function getSummary() returns DashboardSummary;
    function getAssignedChart() returns array of ChartData;
    function getStatusChart() returns array of ChartData;
    function getPriorityChart() returns array of ChartData;
}
