-- ========================================
-- 터미널 상태 모니터링 시스템 데이터베이스 스키마
-- ========================================

-- 데이터베이스 사용
USE `board`;


create table if not exists board (
    id int auto_increment primary key,
    title varchar(255) not null,
    content text not null,
    writer varchar(255) not null,
    password varchar(255) not null,
    created_at datetime not null default current_timestamp,
    updated_at datetime not null default current_timestamp on update current_timestamp
);
