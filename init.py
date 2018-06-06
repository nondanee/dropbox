import os, pymysql, urllib.parse

database_url = os.environ["CLEARDB_DATABASE_URL"]
urllib.parse.uses_netloc.append("mysql")
database = urllib.parse.urlparse(database_url)

connect = pymysql.connect(
    host = database.hostname, 
    user = database.username,
    password = database.password,
    db = database.path[1:],
    charset = "utf8mb4"
)
cursor = connect.cursor()

try:
    cursor.execute('''
        create table user(
            id int(8) zerofill not null auto_increment,
            email varchar(50) not null,
            password varchar(40) not null,
            name varchar(40) not null,
            status tinyint(1) not null,
            primary key(id),
            unique(email)
        )
    ''')
    cursor.execute('''
        create table garage(
            id int(8) zerofill not null auto_increment,
            uid int(8) zerofill not null,
            directory varchar(768) not null,
            name varchar(400) not null,
            type varchar(100) not null,
            modify datetime not null,
            size int(10) not null,
            md5 varchar(32) not null,
            share tinyint(1) not null,
            status tinyint(1) not null,
            index(directory),
            primary key(id),
            foreign key(uid) references user(id) on delete cascade on update cascade
        )
        ''')
    cursor.execute('''
        create table operation(
            id int(8) zerofill not null auto_increment,
            gid int(8) zerofill not null,
            occur datetime not null,
            action tinyint(1) not null,
            original varchar(768) not null,
            modify varchar(768) not null,
            primary key(id),
            foreign key(gid) references garage(id) on delete cascade on update cascade
        )
        ''')
    cursor.execute('''
        create table share(
            id int(8) zerofill auto_increment,
            gid int(8) zerofill not null,
            start datetime not null,
            primary key(id),
            foreign key(gid) references garage(id) on delete cascade on update cascade
        )
        ''')
except Exception as e:
    print(e)
else:
    connect.commit()
    cursor.close()
    connect.close()