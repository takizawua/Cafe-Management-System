create table user(
    id int primary key AUTO_INCREMENT,
    name varchar(250),
    contactNumber varchar(20),
    email varchar(50) UNIQUE,
    password varchar(250),
    status varchar(20),
    role varchar(20),
);

insert into user(name,contactNumber,email,password,status,role) values('admin','1231231231','admin@gmail.com','admin123','true','admin');

CREATE TABLE category (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE product (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    categoryId integer NOT NULL,
    description VARCHAR (255),
    price integer,
    status VARCHAR (20),
    PRIMARY KEY (id)
);

CREATE TABLE productOperations (
    id INT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(200) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contactNumber VARCHAR(20) NOT NULL,
    paymentMethod VARCHAR(25) NOT NULL,
    total INT NOT NULL,
    productDetails JSON DEFAULT NULL,
    createdBy VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);