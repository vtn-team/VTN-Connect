-- Adminer 4.8.1 MySQL 5.5.5-10.6.18-MariaDB-0ubuntu0.22.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `Adventure`;
CREATE TABLE `Adventure` (
  `GameHash` varchar(128) NOT NULL,
  `UserId` int(11) NOT NULL,
  `Result` int(11) NOT NULL DEFAULT 0,
  `LogId` varchar(128) DEFAULT 'NULL',
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`GameHash`,`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `Event`;
CREATE TABLE `Event` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `targetId` int(11) NOT NULL,
  `action` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `Game`;
CREATE TABLE `Game` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `GameHash` varchar(128) NOT NULL,
  `GameId` int(11) NOT NULL,
  `State` tinyint(4) NOT NULL DEFAULT 0,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `GameReplay`;
CREATE TABLE `GameReplay` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `GameId` int(11) NOT NULL,
  `GameHash` varchar(128) NOT NULL,
  `PlayTime` int(11) NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `Message`;
CREATE TABLE `Message` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ToUserId` int(11) NOT NULL,
  `FromUserId` int(11) NOT NULL,
  `Message` text NOT NULL,
  `Emotion` int(11) NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`Id`),
  KEY `Emotion` (`ToUserId`,`Emotion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `UserHash` varchar(128) NOT NULL,
  `Type` int(11) NOT NULL,
  `Name` varchar(256) NOT NULL,
  `Level` int(11) NOT NULL DEFAULT 1,
  `Gold` int(11) NOT NULL DEFAULT 500,
  `PlayCount` int(11) NOT NULL DEFAULT 0,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `LastPlayedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`Id`),
  KEY `UserHash` (`UserHash`),
  KEY `LastPlayedAt` (`LastPlayedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `UserGameStatus`;
CREATE TABLE `UserGameStatus` (
  `UserId` int(11) NOT NULL,
  `DisplayName` varchar(128) NOT NULL,
  `AvatarType` int(11) NOT NULL,
  `Gender` varchar(16) NOT NULL,
  `Age` varchar(16) NOT NULL,
  `Job` varchar(128) NOT NULL,
  `Personality` text NOT NULL,
  `Motivation` text NOT NULL,
  `Weaknesses` text NOT NULL,
  `Background` text NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- 2025-01-29 09:12:17
