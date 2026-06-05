type UserInfo {

    userId : String;
    role   : String;

}

service RoleService @(requires: 'authenticated-user') {

    function getUserInfo()
    returns UserInfo;

}
