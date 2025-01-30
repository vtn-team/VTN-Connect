-- Adminer 4.8.1 MySQL 5.5.5-10.6.18-MariaDB-0ubuntu0.22.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `GameReplay`;
CREATE TABLE `GameReplay` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `GameId` int(11) NOT NULL,
  `GameHash` varchar(128) NOT NULL,
  `PlayTime` int(11) NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- 2025-01-29 09:10:34
