type UserInfo {

    userId   : String;
    userName : String;
    email    : String;
    role     : String;

}

type TechnicianInfo {
    userId   : String;
    userName : String;
}

service RoleService @(requires: 'authenticated-user') {

    function getUserInfo()
    returns UserInfo;

    function getTechnicians()
    returns array of TechnicianInfo;

}
