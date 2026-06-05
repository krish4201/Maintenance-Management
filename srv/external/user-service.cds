@cds.external
service UserService {
    entity UserSet {
        key UserId   : String(10);
            UserName : String(40);
            EmailId  : String(100);
            Role     : String(30);
    }
}
