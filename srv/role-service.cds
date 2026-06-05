type UserInfo {

    userId   : String;
    userName : String;
    email    : String;
    role     : String;

}

service RoleService @(requires: 'authenticated-user') {

    function getUserInfo()
    returns UserInfo;

}
