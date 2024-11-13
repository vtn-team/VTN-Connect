-- Adminer 4.8.1 MySQL 5.5.5-10.6.18-MariaDB-0ubuntu0.22.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `vtn-connect`;
CREATE DATABASE `vtn-connect` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `vtn-connect`;

DROP TABLE IF EXISTS `Event`;
CREATE TABLE `Event` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `targetId` int(11) NOT NULL,
  `action` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `udid` varchar(128) NOT NULL,
  `name` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `udid` (`udid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- 2024-11-12 23:30:59