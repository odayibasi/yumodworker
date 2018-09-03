DROP TABLE IF EXISTS USR_URLS;
CREATE TABLE USR_URLS
(
    USR_URL VARCHAR(512) PRIMARY KEY NOT NULL,
    USR_ID VARCHAR(32),
    URL_STAT tinyint(1),
    USR_NAME VARCHAR(128)
);
CREATE UNIQUE INDEX USR_URLS_URL_UUID_uindex ON USR_URLS (USR_URL);
CREATE INDEX IX_1 on USR_URLS(USR_URL);


DROP TABLE IF EXISTS CRAWL_STATS;
CREATE TABLE CRAWL_STATS
(
    CRAWL_NO INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    TOTAL_URLS INT,
    NEW_URLS INT,
    UPD_URLS INT,
    NON_URLS INT,
    SCORE INT    
);



DROP TABLE IF EXISTS USR;
CREATE TABLE USR
(
    USR_ID VARCHAR(32) PRIMARY KEY NOT NULL,
    USR_FULLNAME VARCHAR(128),    
    USR_NAME VARCHAR(128),
    NUMBER_OF_POST_PUBLISHED INT,
    USERS_FOLLOWED_BY_COUNT INT,
);
CREATE UNIQUE INDEX USR_USR_ID_uindex ON USR (USR_ID);
CREATE INDEX IX_1 on USR(USR_ID);


ALTER TABLE USR ADD USERS_FOLLOWED_BY_COUNT INT;