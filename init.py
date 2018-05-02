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
        create table repository(
            id int(8) zerofill not null auto_increment,
            directory int(8) zerofill not null,
            name varchar(400) not null,
            type varchar(100) not null,
            modify datetime not null,
            size int(10) not null,
            md5 varchar(32) not null,
            share tinyint(1) not null,
            status tinyint(1) not null,
            constraint seek unique (directory,name),
            primary key(id)
        )
        ''')
    cursor.execute('''
        create table history(
            id int(8) zerofill not null,
            version int(4) not null,
            name varchar(400) not null,
            modify datetime not null,
            size int(10) not null,
            md5 varchar(32) not null,
            primary key(id,version),
            foreign key(id) references repository(id) on delete cascade on update cascade
        )
        ''')
    cursor.execute('''
        create table share(
            id int(8) zerofill auto_increment,
            uid int(8) zerofill not null,
            directory int(8) zerofill not null,
            item varchar(100) not null,
            start datetime not null,
            primary key(id),
            foreign key(directory) references repository(id) on delete cascade on update cascade,
            foreign key(uid) references user(id) on delete cascade on update cascade
        )
        ''')
except Exception as e:
    print(e)
else:
    connect.commit()
    cursor.close()
    connect.close()