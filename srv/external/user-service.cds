@cds.external
service UserService {
    entity Users {
        key UserID   : String(50);
            UserName : String(100);
            Role     : String(30);
    }
}
