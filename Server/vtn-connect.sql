-- Adminer 4.8.1 MySQL 5.5.5-10.6.18-MariaDB-0ubuntu0.22.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `vtn-connect`;
CREATE DATABASE `vtn-connect` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `vtn-connect`;

DROP TABLE IF EXISTS `Adventure`;
CREATE TABLE `Adventure` (
  `GameHash` varchar(128) NOT NULL,
  `UserId` int(11) NOT NULL,
  `Result` int(11) NOT NULL,
  `LogId` varchar(128) NOT NULL,
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

INSERT INTO `Event` (`id`, `userId`, `targetId`, `action`, `createdAt`) VALUES
(2,	1,	1,	1,	'2024-11-13 01:00:37'),
(3,	1,	1,	1,	'2024-11-13 01:00:47'),
(4,	1,	1,	1,	'2024-11-13 01:01:08'),
(5,	1,	0,	2,	'2024-11-13 01:03:31'),
(6,	1,	0,	2,	'2024-11-13 01:03:33');

DROP TABLE IF EXISTS `Message`;
CREATE TABLE `Message` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `ToUserId` int(11) NOT NULL,
  `FromUserId` int(11) NOT NULL,
  `Message` text NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`Id`)
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

INSERT INTO `User` (`Id`, `UserHash`, `Type`, `Name`, `Level`, `Gold`, `PlayCount`, `CreatedAt`, `LastPlayedAt`) VALUES
(1,	'185313f1-c2c8-11ef-8d4f-0ea32b56e377',	2,	'『いぬ』',	99,	500,	0,	'2024-12-25 22:56:52',	'2025-12-24 00:00:00'),
(2,	'423c1220-c2cf-11ef-8d4f-0ea32b56e377',	2,	'『ハルミ・マルオカ』',	30,	5000,	0,	'2024-12-25 23:46:22',	'2025-12-24 00:00:00'),
(100,	'58cd482e-c2cf-11ef-8d4f-0ea32b56e377',	2,	'『ねこ』',	666,	666,	0,	'2024-12-25 23:48:47',	'2025-12-24 00:00:00'),
(999,	'last unique ref',	2,	'last unique ref',	1,	500,	0,	'2024-12-25 22:15:50',	'2025-12-24 00:00:00'),
(1008,	'c0b8fdd0-b5f8-4a82-a921-eff7d9655ff4',	1,	'クリス・レッドフィールド',	1,	500,	0,	'2024-12-25 22:53:37',	'2024-12-26 00:46:05'),
(1009,	'51fb59f3-a714-45e6-89b5-3fc268ea7ede',	1,	'佐藤 太郎',	1,	500,	0,	'2024-12-25 22:53:44',	'2024-12-26 00:46:05'),
(1010,	'7cdfa595-f940-4e1a-baab-94fcbd7a1114',	1,	'モモカ・イシカワ',	1,	500,	0,	'2024-12-25 22:53:52',	'2024-12-26 00:46:05'),
(1011,	'a44ec785-9ed0-41a3-9cce-67f0b4a4e0c3',	1,	'不明',	1,	500,	0,	'2024-12-26 00:44:48',	'2024-12-26 00:46:24'),
(1012,	'2dfff81b-6afa-40d8-a8b5-3d73cb115d91',	1,	'鈴木 桃子',	1,	500,	0,	'2024-12-26 00:45:01',	'2024-12-26 00:46:24'),
(1013,	'5683fc70-0d4c-4f6e-9d88-89b2da8494a4',	1,	'佐藤健一',	1,	500,	0,	'2024-12-26 00:45:13',	'2024-12-26 00:46:24');

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

INSERT INTO `UserGameStatus` (`UserId`, `DisplayName`, `AvatarType`, `Gender`, `Age`, `Job`, `Personality`, `Motivation`, `Weaknesses`, `Background`) VALUES
(1,	'『いぬ』',	10,	'犬',	'5000',	'犬',	'わんわん',	'（Ｕ＾ω＾）わんわんお！',	'わおん(笑)',	'いぬ、生きずして死すこと無し。ご飯のお皿、満つらざるとも屈せず。これ、後悔と共に死すこと無し…'),
(2,	'『マルオ』',	2,	'男性',	'30',	'無職',	'プログラムのことしか考えない',	'社畜根性',	'いうことを聞かない',	'工場が燃えた'),
(100,	'『ねこ』',	2,	'不明',	'666',	'ねこ',	'にゃ～ん',	'にゃ～ん',	'にゃ～ん(笑)',	'猫は常にあなたの背後にいる。'),
(1008,	'クリス',	1,	'男性',	'38',	'特殊部隊員',	'勇敢で責任感が強い',	'人々を守るために戦う',	'過去のトラウマに悩まされることがある',	'特殊部隊S.T.A.R.S.の一員として、バイオハザードによる事件に立ち向かってきた。'),
(1009,	'タロウ',	1,	'男性',	'25',	'エンジニア',	'冷静沈着で理論的だが、時にはお茶目な一面もある',	'新しい技術で世界を変えたいと思っている',	'完璧主義で、時に決断力に欠ける',	'大学でコンピュータサイエンスを学び、その後大手企業に入社。仕事に情熱を持ちながらも、家族の期待に応えることに悩んでいる。'),
(1010,	'モモ',	1,	'女性',	'22',	'大学生・アルバイト',	'明るく元気で好奇心旺盛だが、少しおっちょこちょい',	'新しいことを学びたい、自分の可能性を広げたい',	'注意力散漫で、瞬間的な判断力に欠ける',	'地方出身の大学生で、親の期待に応えようと奮闘中。バイトでの経験を通じて自立心を育んでいる。'),
(1011,	'キャラクター',	1,	'不明',	'不明',	'不明',	'不明',	'不明',	'不明',	'不明'),
(1012,	'モモ',	1,	'女性',	'25',	'イラストレーター',	'明るくておおらかだが、少しおっちょこちょい',	'自分の作品を多くの人に見てもらいたいと思っている',	'集中力が続かず、時々大事なことを忘れがち',	'幼少期から絵を描くことが大好きで、高校卒業後にイラストレーターとしての道を選んだ。'),
(1013,	'ケン',	1,	'男性',	'25',	'エンジニア',	'内向的だが、一度心を開くと非常に親しみやすい',	'新しい技術を通じて世界をより良くしたい',	'社交的な場が苦手で、自信を持てないことがある',	'小さい頃からプログラミングに興味を持ち、独学で技術を身につけた。現在は大手IT企業でエンジニアとして働きながら、自分のプロジェクトも進めている。');

-- 2024-12-25 15:57:40
