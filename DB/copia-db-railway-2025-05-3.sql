-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: autorack.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Ciudad`
--

DROP TABLE IF EXISTS `Ciudad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ciudad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_postal` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ciudad`
--

LOCK TABLES `Ciudad` WRITE;
/*!40000 ALTER TABLE `Ciudad` DISABLE KEYS */;
/*!40000 ALTER TABLE `Ciudad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Destinatario`
--

DROP TABLE IF EXISTS `Destinatario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Destinatario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion_entrega` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalleDireccion` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noProhibidos` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Destinatario`
--

LOCK TABLES `Destinatario` WRITE;
/*!40000 ALTER TABLE `Destinatario` DISABLE KEYS */;
INSERT INTO `Destinatario` VALUES (1,'Miriam','Rodríguez ','CC','10101857765','qompandre@misena.edu.co','3125653562','X','E',1),(2,'Enrique ','Rodríguez ','CC','10101857765','qompandre@misena.edu.co','3125653562','T','to marte',1),(3,'Miriam','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','W','R',1),(4,'Miriam','Rodríguez ','CC','10101111111111','qompandre@misena.edu.co','3220000000','E','T',1),(5,'Miriam','T','NIT','10101111111111','qompandre@misena.edu.co','3220000000','R','T',1),(6,'Miriam','Rodríguez ','NIT','10101857765','qompandre@misena.edu.co','3125653562','R','T',1),(7,'Andrés Mauricio','Gallo Amado','CC','1010185904','lopezalirioda@hotmail.es','3144398373','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(8,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','F','E',1),(9,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','E','R',1),(10,'Andrés Mauricio','Gallo Amado','CC','1030640184','lopezalirioda@hotmail.es','3144576352','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(11,'Andrés Mauricio','Gallo Amado','CC','1030640184','roboticswarpdesarrollador@gmail.com','314493626','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(12,'Andrés Mauricio','Gallo Amado','NIT','1030640184','lopezalirioda@hotmail.es','3144983822','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(13,'Andrés Mauricio','Gallo Amado','NIT','1010185111','q@q.com','419876252','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(14,'Miriam','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','R',1),(15,'Miriam','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','R',1),(16,'Enrique ','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','R','R',1),(17,'Enrique ','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','W','R',1),(18,'Enrique ','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','E','R',1),(19,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','D','F',1),(20,'Enrique ','T','NIT','1010185789','qompandre@misena.edu.co','3125653562','D','E',1),(21,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(22,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(23,'Enrique ','T','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(24,'Miriam','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(25,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','T',0),(26,'Mayerly','Y','CC','1030640184','q@q.com','3214563254','2','Calle7',1),(27,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','Q','R',1),(28,'Enrique ','T','CC','1010185789','qompandre@misena.edu.co','3125653562','12','F',1),(29,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(30,'Miriam','Rodríguez ','CE','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(31,'Enrique ','T','NIT','10101111111111','qompandre@misena.edu.co','3125653562','R','E',1),(32,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(33,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(34,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(35,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(36,'Miriam','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(37,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(38,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(39,'Enrique ','T','CC','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(40,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','W',1),(41,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(42,'Julia','Roberts','CC','1010185999','juliar@misena.edu.co','3125653562','E','R',1),(43,'Enrique ','Roberts','CC','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(44,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(45,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','S','R',1),(46,'Eduardo','Forero','CC','23444','gokufor399@gmail.com','3224265','Cll 152b # 106b 52  casa 9A','Cll 152b # 106b 52  casa 9A',1),(47,'José ','Ttt','CC','53931057','gokufor399@gmail.com','3224265','Calle 44 ','Jjj',1),(48,'José ','Ttt','CC','53931057','gokufor399@gmail.com','3224265','Calle 44 ','Jjj',1),(49,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','S',0),(50,'Miriam','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','S',1),(51,'Enrique ','Roberts','CC','1010185789','qompandre@misena.edu.co','3125653562','R','W',1),(52,'Andrés Mauricio','Gallo Amado','CC','1010185904','qompandre@hotmail.es','3222959089','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(53,'Miriam','Roberts','CC','1010185789','qompandre@misena.edu.co','3125653562','G','E',1),(54,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','E',0),(55,'Maye','w','CC','1030640176','q@q.es','3222976523','ss','s',1),(56,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(57,'Enrique ','Rodríguez ','CE','1010185789','qompandre@misena.edu.co','3125653562','W','F',1),(58,'Enrique ','Ed','CC','1010185789','e@e.com','3125653562','W','to marte',1),(59,'Enrique ','Ed','NIT','1010185789','e@e.com','3125653562','W','to marte',1),(60,'Enrique ','Ed','NIT','1010185789','e@e.com','3125653562','W','to marte',1),(61,'Enrique ','Ed','NIT','1010185789','e@e.com','3125653562','Q','E',1),(62,'Enrique ','Ed','NIT','1010185789','e@e.com','3125653562','W','E',1),(63,'Enrique ','Ed','CC','1010185789','e@e.com','3125653562','Q','to marte',1),(64,'Enrique ','Ed','CC','1010185789','e@e.com','3125653562','W','to marte',1),(65,'Enrique ','Ed','CC','1010185789','e@e.com','3125653562','W','to marte',1),(66,'Andrés Mauricio','Gallo Amado','CC','1010185940','qompandre@hotmail.es','3222959089','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(67,'Andrés Mauricio','Gallo Amado','NIT','1010185904','qompandre@hotmail.es','3222959089','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(68,'Andrés Mauricio','Gallo Amado','CC','1010185940','qompandre@hotmail.es','3144395567','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(69,'Andrés Mauricio','Gallo Amado','CC','1030640184','lopezalirioda@hotmail.es','432678654','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(70,'Andrés Mauricio','Gallo Amado','CC','1010185111','q@q.com','7','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(71,'Andrés Mauricio','Gallo Amado','NIT','1030640184','lopezalirioda@hotmail.es','3144397727','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(72,'Andrés Mauricio','Gallo Amado','CE','1010185904','q@q.com','314439883','DG 38 # 19 - 82','DG 38 # 19 - 82',0),(73,'Andrés Mauricio','Gallo Amado','NIT','1010185111','lopezalirioda@hotmail.es','413787262','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',0),(74,'Andrés Mauricio','Gallo Amado','CC','101018593','Q@Q.COM','3144988282','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(75,'Andrés Mauricio','Gallo Amado','CC','1010185940','q@q.com','214987623','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(76,'Andrés Mauricio','Gallo Amado','CC','1010185940','q@q.com','214987623','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(77,'Andrés Mauricio','Gallo Amado','CC','10101111111111','lopezalirioda@hotmail.es','3144599292','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(78,'Andrés Mauricio','Gallo Amado','CC','1010185789','juandaza@gmail.com','314498837','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',0),(79,'Andrés Mauricio','Gallo Amado','CC','1030640184','lopezalirioda@hotmail.es','314873232','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(80,'Alirio','Perez','CC','1010185904','lopezalirioda@hotmail.es','3222959089','e','x',1),(81,'Sandro','Gomez','CC','1010185789','e@e.com','3125653562','W','to marte',1),(82,'Andrea','Diaz','CC','12345699876','w@w.com','3142536525','S','6',1),(83,'Dario','Lopez','CC','1030640184','qompandre@hotmail.es','3222959089','calle 5','8',1),(84,'Juan','Hay ','CC','23444','sskj.@gmail.vom','64984546','J','J',1),(85,'Daniel','E','CC','10102221112','w@w.com','3144395525','W','W',1),(86,'Andres','Gutiérrez ','CC','1010185940012','q@q.com','3142568587','Calle 6','9',1),(87,'Juan','Hay ','CC','23444','sskj.@gmail.vom','64984546','Ángela Angel','J',1),(88,'Oskar','Forero','','1031640494','skrfv17@gmail.com','3243452971','Crr 59b #131-27','Crr 59b #131-27',1),(89,'Juan ','Perez','CE','0987654321','venequito@gmail.com','32148277','Cll 131#1','Bloque 0',1),(90,'Juan','Hay ','CC','23444','sskj.@gmail.vom','64984546','B','B',1),(91,'Juan','Perez','CC','23444','sskj.@gmail.vom','64984546','Bhjj','Jjj',1),(92,'Juan','Perez','CE','23444','sskj.@gmail.vom','3224265','Hhh',NULL,1),(93,'Andres Gallo','Gutiérrez ','CC','1010185940012','q@q.com','3142568587','W','E',0),(94,'Andres Gallo','Gutiérrez ','NIT','1010185940012','q@q.com','3142568587','D','R',1),(95,'Andrés Mauricio','Gallo Amado','NIT','1010185940','roboticswarpdesarrollador@gmail.com','3144395525','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(96,'Andres Gallo','T','CC','1010185940012','e@r.com','3142568587','D','G',0),(97,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','W',0),(98,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','W','G',1),(99,'Juan','Hay ','NIT','737384','sskj.@gmail.vom','3224265','Torre 91 ','Y',1),(100,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','W','W',1),(101,'Juan','Hay ','NIT','23444','sskj.@gmail.vom','3224265','Calle 1','Hghh',1),(102,'Juan','Perez','CE','23444','sskj.@gmail.vom','3224265','Calle 64 ','Hghh',1),(103,'Juan','Hay ','CC','23444','sskj.@gmail.vom','3224265','Jhh',NULL,1),(104,'Juan','Perez','CC','23444','sskj.@gmail.vom','3224265','Bahab','Bbjj',1),(105,'Angel','Calderon','NIT','1089457045','tilininasl78@gmail.com','3259683652','Calle 80 N13A-32','Torre 15 apto 104',1),(106,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','9',1),(107,'Juan','Hay ','NIT','23444','sskj.@gmail.vom','3224265','Vale 67','B',1),(108,'Sam','Ok','TI','50','sam@gmail.com','320','Ok','0',1),(109,'De','Para','CC','234','lomas@123.com','320','Ok','Calle ',1),(110,'Val ','Cap','CC','82','skrfv17@gmail.com','319','Calle ','Ol',0),(111,'Juan','El ','CC','23444','sskj.@gmail.vom','3224265','Bgh',NULL,1),(112,'Eduardo ','Gt','CE','3171427','sskj.@gmail.vom','3224265','Hgg',NULL,1),(113,'Jhon Eduin ','El ','CC','737384','sskj.@gmail.vom','64984546','G',NULL,1),(114,'Eduardo ','Perez','CC','737384','sskj.@gmail.vom','3224265','Jjh',NULL,1),(115,'G','G','CC','234','rev@hotmail.com','320','Calle ','Calle ',1),(116,'Eduardo ','El ','NIT','737384','sskj.@gmail.vom','64984546','Jgg',NULL,1),(117,'Jenny Patricia ','Vargas ','CC','52927467','velasqueznicol248@gmail.com','3236810802','Carrera 59b #131-27',NULL,0),(118,'Sam','Cap','CC','234','skrfv17@gmail.com','320','Calle ','Ok',1),(119,'Jhon Eduin ','Perez','NIT','737384','sskj.@gmail.vom','64984546','Jjkk',NULL,1),(120,'Jenny Patricia ','Vargas ','CC','52927467','velasqueznicol248@gmail.com','3236810802','Carrera 59b 131-27',NULL,0),(121,'Jenny Patricia ','Vargas ','CC','52927467','velasqueznicol248@gmail.com','3236810802','Carrera 59b 131-27',NULL,1),(122,'Jhon Eduin ','Gt','CC','737384','germitan@live.com','64984546','Gvvv',NULL,1),(123,'Jenny ','Sandy','CC','52927467','velasqueznicol248@gmail.com','3236810802','Carrera 59b 131-27\n',NULL,1),(124,'Juan','Perez','CC','737384','sskj.@gmail.vom','3224265','Hghjj ',NULL,1),(125,'Eduardo ','Perez','TI','23444','sskj.@gmail.vom','3224265','Jhjkjh',NULL,1),(126,'Andrés Mauricio','Gallo Amado','CE','1010185904','qompandre@hotmail.es','3222959089','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(127,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','Q',1),(128,'Andrés Mauricio','Gallo','CE','1010185789','juandaza@gmail.com','3222959089','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(129,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','G',1),(130,'Andres Gallo','T','NIT','1010185940012','e@r.com','3142568587','Q','G',1),(131,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','9',1),(132,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','9',1),(133,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','9',1),(134,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','G',1),(135,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','W','G',1),(136,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','9',1),(137,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','9',1),(138,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','G',1),(139,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','S','9',1),(140,'Andres Gallo','T','CC','1010185940012','e@r.com','3142568587','Q','G',1),(141,'Andrés Mauricio','Gallo Amado','NIT','1010185940','roboticswarpdesarrollador@gmail.com','3222959089','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(142,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','Q',1),(143,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','W',1),(144,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','W','Q',1),(145,'Andrés Mauricio','Gallo Amado','CC','1010185940','roboticswarpdesarrollador@gmail.com','3149043239','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(146,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','W','A',1),(147,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','R','W',1),(148,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','S','9',1),(149,'Andrés Mauricio','Gallo Amado','CC','1010185940','roboticswarpdesarrollador@gmail.com','3144309772','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(150,'Andrés Mauricio','Gallo Amado','CC','1010185940','roboticswarpdesarrollador@gmail.com','3144309822','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(151,'Andrés Mauricio','Gallo','CC','10101984324','roboticswarpdesarrollador@gmail.com','3139838313','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(152,'Andrés Mauricio','Gallo Amado','CC','1010184823','roboticswarpdesarrollador@gmail.com','3137828128','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(153,'Andrés Mauricio','Gallo Amado','NIT','1010101312','roboticswarpdesarrollador@gmail.com','3144309291','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(154,'Andres Gallo','T','CE','1010185940012','e@r.com','3142568587','W','R',1),(155,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','W','G',1),(156,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','W','9',1),(157,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','Q','W',1),(158,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','Q',1),(159,'Eduardo ','Perez','CE','737384','sskj.@gmail.vom','3008080808','Tott','Kjh',1),(160,'Eduardo ','Hay ','CC','3171427','sskj.@gmail.vom','3008080808','Total ','',1),(161,'Eduardo ','Perez','NIT','3171427','sskj.@gmail.vom','3224260914','T','',1),(162,'Eduardo ','Hay ','NIT','3171427','sskj.@gmail.vom','3224260914','Jhh','',1),(163,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','9',1),(164,'Andres Gallo','Re','CC','10997971197','e@r.com','3142568587','W','9',1),(165,'Andres Gallo','Re','NIT','10997971197','e@r.com','3142568587','W','9',1),(166,'Eduardo ','Hay ','CE','737384','sskj.@gmail.vom','3224260914','Hhh','',1),(167,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','W','W',1),(168,'Ana Maria','Amado salamanca','CC','51437158','anaamado19432@gmail.com','3059628546','Calle 80 N 13A-32','Torre 5 apto 603',1),(169,'Andres Gallo','Re','CC','1010185940012','e@r.com','3142568587','Q','Q',1),(170,'Andres Gallo','T','NIT','1010185940012','e@r.com','3142568587','Q','9',1),(171,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','W',1),(172,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','W','G',1),(173,'Andres Gallo','Re','TI','1010185940012','e@r.com','3142568587','Q','W',1),(174,'Andres Gallo','Re','TI','1010185940012','e@r.com','3142568587','Q','G',1),(175,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','G',1),(176,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','Q','Q',1),(177,'Andres Gallo','T','CE','1010185940012','e@r.com','3142568587','Q','G',1),(178,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','Q','G',1),(179,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','W','W',1),(180,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','Q','G',1),(181,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','Q','G',1),(182,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','D','Q',1),(183,'Andres Gallo','T','CE','1010185940012','e@r.com','3142568587','Q','Q',1),(184,'Andre','T','CC','10997971197','e@r.com','3142568587','X','X',1),(185,'Juan','Perez','CC','23444','sskj.@gmail.vom','3224265222','Hhh','Hghh',1),(186,'Juan','Hay ','CC','737384','sskj.@gmail.vom','3224260914','H','',1),(187,'Ange ','Cap','CC','234','skrfv17@gmail.com','3224264243','Bvvh','',1),(188,'Ange ','Cap','CC','234','anvicap28@gmail.com','3224264243','Bvvbb','',1),(189,'Eduardo ','Perez','CE','23444','sskj.@gmail.vom','3224260914','Bcvjb','',1),(190,'Eduardo ','Hay ','CC','737384','sskj.@gmail.vom','3224260914','Nsj','',1),(191,'Eduardo ','Perez','CC','80808808','sskj.@gmail.vom','3224260914','Vg','',1),(192,'Eduardo ','Perez','CE','23444','sskj.@gmail.vom','3224260914','Bbv','',1),(193,'Ange ','Cap','CE','234','skrfv17@gmail.com','3224264243','Bhv','',1),(194,'Ange ','Cap','CE','234','skrfv17@gmail.com','3224264243','Hh','',1),(195,'Eduardo ','Perez','CC','80808808','sskj.@gmail.vom','3224260914','Hb','',1),(196,'Juan','Perez','NIT','23444','sskj.@gmail.vom','3224265222','Bbjb','',1),(197,'Eduardo ','Perez','CE','80808808','sskj.@gmail.vom','3224260914','Hgh','',1),(198,'Juan','Hay ','CC','80808808','sskj.@gmail.vom','3224260914','Bbv','',1),(199,'Juan','Perez','CE','23444','sskj.@gmail.vom','3224260914','Jhbb','',1),(200,'Juan','Perez','CE','23444','sskj.@gmail.vom','3224260914','Bv','',1),(201,'Carlos ','Mojica ','CC','1055730349','carlosjimeces@gmail.com','3211215149','Carrera 81c#13a32','101toree 8 ',1),(202,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','Q','S',1),(203,'Juan ','Moli','CC','1055730349','juana@gmail.com','3211215149','Carrera 81b #13a45','Torres 8 104',1),(204,'Andres Gallo','Re','NIT','1010185940012','e@r.com','3142568587','Q','W',1),(205,'Ange ','Cap','CC','234','skrfv17@gmail.com','3224264243','Hh','',1),(206,'Juan','Perez','NIT','23444','sskj.@gmail.vom','3224260914','Bv','',1),(207,'Juan','Perez','CC','23444','sskj.@gmail.vom','3224260914','Bb','',1),(208,'Sam','Para','CC','50','skrfv17@gmail.com','3224264243','Tr','',1),(209,'Juan','Hay ','CC','80808808','sskj.@gmail.vom','3224260914','Tg','',1),(210,'Andrés Mauricio','Gallo Amado','CC','1010187261','roboticswarpdesarrollador@gmail.com','4316761512','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(211,'Andres Gallo','Re','CE','1010185940012','e@r.com','3142568587','W','G',1),(212,'Andres Gallo','T','CC','1010185940012','e@r.com','3142568587','Q','G',1);
/*!40000 ALTER TABLE `Destinatario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Envio`
--

DROP TABLE IF EXISTS `Envio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Envio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `remitente_id` int NOT NULL,
  `destinatario_id` int NOT NULL,
  `ciudad_origen_id` int NOT NULL,
  `ciudad_destino_id` int NOT NULL,
  `tipo_envio` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alto` decimal(5,2) NOT NULL,
  `ancho` decimal(5,2) NOT NULL,
  `largo` decimal(5,2) NOT NULL,
  `peso` decimal(5,2) NOT NULL,
  `valor_declarado` decimal(10,2) NOT NULL,
  `costo_total` decimal(10,2) NOT NULL,
  `recomendaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_envio` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Envio_remitente_id_fkey` (`remitente_id`),
  KEY `Envio_destinatario_id_fkey` (`destinatario_id`),
  KEY `Envio_ciudad_origen_id_fkey` (`ciudad_origen_id`),
  KEY `Envio_ciudad_destino_id_fkey` (`ciudad_destino_id`),
  CONSTRAINT `Envio_ciudad_destino_id_fkey` FOREIGN KEY (`ciudad_destino_id`) REFERENCES `Ciudad` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Envio_ciudad_origen_id_fkey` FOREIGN KEY (`ciudad_origen_id`) REFERENCES `Ciudad` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Envio_destinatario_id_fkey` FOREIGN KEY (`destinatario_id`) REFERENCES `Destinatario` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Envio_remitente_id_fkey` FOREIGN KEY (`remitente_id`) REFERENCES `Remitente` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Envio`
--

LOCK TABLES `Envio` WRITE;
/*!40000 ALTER TABLE `Envio` DISABLE KEYS */;
/*!40000 ALTER TABLE `Envio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EnvioTipoProducto`
--

DROP TABLE IF EXISTS `EnvioTipoProducto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EnvioTipoProducto` (
  `envio_id` int NOT NULL,
  `tipo_producto_id` int NOT NULL,
  PRIMARY KEY (`envio_id`,`tipo_producto_id`),
  KEY `EnvioTipoProducto_tipo_producto_id_fkey` (`tipo_producto_id`),
  CONSTRAINT `EnvioTipoProducto_envio_id_fkey` FOREIGN KEY (`envio_id`) REFERENCES `Envio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EnvioTipoProducto_tipo_producto_id_fkey` FOREIGN KEY (`tipo_producto_id`) REFERENCES `TipoProducto` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EnvioTipoProducto`
--

LOCK TABLES `EnvioTipoProducto` WRITE;
/*!40000 ALTER TABLE `EnvioTipoProducto` DISABLE KEYS */;
/*!40000 ALTER TABLE `EnvioTipoProducto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `HistorialEnvio`
--

DROP TABLE IF EXISTS `HistorialEnvio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `HistorialEnvio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `NumeroGuia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Origen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Destino` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Destinatario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaSolicitud` datetime DEFAULT NULL,
  `PerfilId` int DEFAULT NULL,
  `Estado` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DestinatarioId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PerfilId` (`PerfilId`),
  CONSTRAINT `HistorialEnvio_PerfilId_fkey` FOREIGN KEY (`PerfilId`) REFERENCES `Perfil` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `HistorialEnvio`
--

LOCK TABLES `HistorialEnvio` WRITE;
/*!40000 ALTER TABLE `HistorialEnvio` DISABLE KEYS */;
INSERT INTO `HistorialEnvio` VALUES (2,'GUIA-20241218-2HLY','1329008467','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 16:25:08',2,NULL,77),(3,'GUIA-20241218-QBD2','1329008845','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 16:46:31',2,'Recolección programada',77),(4,'GUIA-20241218-P30E','1320639076','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 18:10:34',NULL,'Recolección programada',77),(5,'GUIA-20241218-WQVB','1329016799','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 20:36:42',2,'Recolección programada',77),(6,'GUIA-20241218-2FMN','1329016877','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 20:41:01',7,'Recolección programada',77),(7,'GUIA-20241218-B009','1329017225','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 21:12:22',2,'Recolección programada',77),(8,'GUIA-20241218-35WW','1329015637','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 21:17:12',7,'Recolección programada',77),(9,'GUIA-20241218-2511','1320641208','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 22:18:20',7,'Recolección programada',77),(10,'GUIA-20241218-2T55','1320641818','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 23:44:00',2,'Recolección programada',77),(11,'GUIA-20241218-H6J5','1320641830','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 23:46:51',2,'Recolección programada',77),(12,'GUIA-20241218-UXBX','1320641862','Bogotá','Bogotá','Andrés Mauricio Gallo Amado','2024-12-18 23:49:28',2,'Recolección programada',77),(13,'GUIA-20241218-K6RH','1320644024','Calle 9 ','DG 38 # 19 - 82\nDG 38 # 19 - 82','Andrés Mauricio Gallo Amado','2024-12-19 00:42:16',2,'Recolección programada',78),(14,'GUIA-20241218-KBZ6','1329022037',' 486 N High street','DG 38 # 19 - 82\nDG 38 # 19 - 82','Andrés Mauricio Gallo Amado','2024-12-19 03:29:52',9,'Recolección programada',79),(15,'GUIA-20241218-9IUR','1329022091','calle 5','e','Alirio Perez','2024-12-19 03:42:01',10,'Recolección programada',80),(16,'GUIA-20241218-QE21','1329022131','Calle 9 ','W','Sandro Gomez','2024-12-19 03:51:37',2,'Recolección programada',81),(17,'GUIA-20241218-1B5Y','1320644920','Calle  6','S','Andrea Diaz','2024-12-19 04:04:43',NULL,'Recolección programada',82),(18,'GUIA-20241218-Z3UG','1329022205','calle 7','calle 5','Dario Lopez','2024-12-19 04:14:47',NULL,'Recolección programada',83),(19,'GUIA-20241219-J1K3','1329026037','calle 7','W','Daniel E','2024-12-19 14:39:37',NULL,'Recolección programada',85),(20,'GUIA-20250212-Q4QX','1322146476','Calle 8','W','Andres Gallo Re','2025-02-12 18:41:30',NULL,'Recolección programada',100),(21,'GUIA-20250223-PVUD','1332296525','CRA 1#1','Bahab','Juan Perez','2025-02-24 03:23:32',8,'Recolección programada',104),(22,'GUIA-20250326-83WJ','1333852033','CRA 1#1','Jjkk','Jhon Eduin  Perez','2025-03-26 23:06:02',8,'Recolección programada',119),(23,'GUIA-20250412-IVQ2','1334738227','Calle 9 ','DG 38 # 19 - 82','Andrés Mauricio Gallo','2025-04-13 01:46:38',2,'Recolección programada',153),(24,'GUIA-20250412-JJ3A','1334738283','Calle 9 ','DG 38 # 19 - 82','Andrés Mauricio Gallo','2025-04-13 02:03:42',2,'Recolección programada',153),(25,'GUIA-20250503-M0WP','FREE-1746291831045','Calle 8','Q','Andres Gallo T','2025-05-03 17:03:55',21,'Recolección programada',212);
/*!40000 ALTER TABLE `HistorialEnvio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Perfil`
--

DROP TABLE IF EXISTS `Perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Perfil` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion_recogida` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detalle_direccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recomendaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `esAdministrador` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Perfil_correo_key` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Perfil`
--

LOCK TABLES `Perfil` WRITE;
/*!40000 ALTER TABLE `Perfil` DISABLE KEYS */;
INSERT INTO `Perfil` VALUES (1,'das','sda','q@q.com','cc','10101920','31448373','5','6','6',0),(2,'Enrique ','Mauricio Amado','roboticswarpdesarrollador@gmail.com','CC','1010185789','3125653562','Calle 9 ','to marte','X',1),(5,'Eduardo ','Goku For','gokufor399@gmail.com','CC','23444','3224265','CRA 1#1','Cll 152b # 106b 52  ','Vjjhh',1),(7,'Alexander','Alex','alexcellshopping@gmail.com','CC','1010187777','3144567890','calle 8- 9','3','x',0),(8,'Juan Perez','German Eduardo Forero','3000bisonte@gmail.com','CE','80808808','3224260914','Avenida Tierra','Casa A9','',0),(9,'Pedro','Pedro','p9206848@gmail.com','CC','1010183333','3145678723',' 486 N High street','4','x',0),(10,'Hector','Hector','mercaenvios1@gmail.com','NIT','1010999996','3222959089','calle 5','5','x',0),(13,'Miriam','Josue Hernandez','vivoshow.2366@gmail.com','CC','1010185940','3222959089','calle 5','6','x',0),(16,'Oskar ','Oskar Forero','skrfv17@gmail.com','CC','1031640494','3243452971','Cll 152b # 106b - 60','Bloque A casa 9','',0),(17,'Jenny Vargas ','Nicol Velasquez','velasqueznicol248@gmail.com','CC','','','','','',0),(18,'Nicole','Nicole Amado','amadonicole251@gmail.com','NIT','1027284075','3214029526','Calle 80 N13A-32','Torre 5 apto 603','Ahjmmda',0),(19,'Lolito','Pepito Perez','15abriles2000@gmail.com','CC','737384','64984546','CRA 1#1','Hghh','Suba . Bogotá ',0),(20,'Ange ','Angela Capera','anvicap28@gmail.com','CC','18','32050','Calle 1','0','Ok',0),(21,'Andres Gallo','Andrés Mauricio Gallo Amado','andres.gallo@softwarehefziba.com','CC','10997971197','3142568587','Calle 8','9','X',0),(22,'Migeil','migel albarracin','miguel730347@gmail.com','CC','1055730337','3212125140','Carrera 80c#13a 32','Torres 8 104','Dejar en portería y llamar al cliente inmediatamente ',0);
/*!40000 ALTER TABLE `Perfil` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Remitente`
--

DROP TABLE IF EXISTS `Remitente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Remitente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion_recogida` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle_direccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recomendaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Remitente_numero_documento_key` (`numero_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Remitente`
--

LOCK TABLES `Remitente` WRITE;
/*!40000 ALTER TABLE `Remitente` DISABLE KEYS */;
INSERT INTO `Remitente` VALUES (1,'Enrique ','CC','1010185789','3125653562','Calle 9 ','to marte','X'),(2,'Mayer6','CC','1030640166','3214563254','Calle 4','Calle7','C'),(3,'Fonseca','CC','1010107133','3125653562','W','E','X'),(4,'Eduardo ','CC','23444','3224265','CRA 1#1','Cll 152b # 106b 52  casa 9A','Vjjhh'),(5,'Maye','CC','1030640176','3222976523','Calle 8','7','x'),(6,'Alexander','CC','1010187777','3144567890','calle 8- 9','3','x'),(7,'Pedro','CC','1010183333','3145678723',' 486 N High street','4','x'),(8,'Hector','NIT','1010999996','3222959089','calle 5','5','x'),(9,'Andrea','CC','12345699876','3142536525','Calle  6','T','X'),(10,'Daniel','CC','10102221112','3144395525','calle 7','6','x'),(11,'Andres Gallo','CC','1010185940012','3142568587','Calle 8','9','X'),(12,'Oskar ','CC','1031640494','3243452971','Cll 152b # 106b - 60','Bloque A casa 9',''),(13,'Nicole','NIT','1027284075','3214029526','Calle 80 N13A-32','Torre 5 apto 603','Ahjmmda'),(14,'Lolito','CC','737384','64984546','CRA 1#1','Hghh','Suba . Bogotá '),(15,'Ange ','CC','18','32050','Calle 1','0','Ok'),(16,'Jenny Vargas ','CC','52927467','3236810802','','',''),(17,'Andres Gallo','CC','10997971197','3142568587','Calle 8','9','X'),(18,'Juan Perez','CE','80808808','3224260914','Avenida Tierra','Casa A9',''),(19,'Migeil','CC','1055730337','3212125140','Carrera 80c#13a 32','Torres 8 104','Dejar en portería y llamar al cliente inmediatamente ');
/*!40000 ALTER TABLE `Remitente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TipoProducto`
--

DROP TABLE IF EXISTS `TipoProducto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TipoProducto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TipoProducto`
--

LOCK TABLES `TipoProducto` WRITE;
/*!40000 ALTER TABLE `TipoProducto` DISABLE KEYS */;
/*!40000 ALTER TABLE `TipoProducto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('1d08ef6a-c641-4c0e-af94-d64dd1d79472','c62a80f7a8dec58f1ede6bc0175064ebaa908f84d4974528022b22a864f339e5','2024-12-18 16:23:21.742','20241218162320_update_numero_guia',NULL,NULL,'2024-12-18 16:23:20.944',1),('2fc5516e-b105-4a6d-b051-6082357ecc48','909e1415d9a80aa8bcfad1b99ce220db24ef115e6689bbe38ac90a9cedac25e7','2024-12-18 23:38:52.861','20241218233851_add_destinatario_id',NULL,NULL,'2024-12-18 23:38:52.091',1),('7c6712dc-4ddc-46ec-9ebf-76c956205f95','949bbf9beb97438efa44539ac1673b04d3f1da0a2d58922e6f9b700bb952886c','2024-12-18 17:15:42.977','20241218171541_add_admin_flag_to_perfil',NULL,NULL,'2024-12-18 17:15:42.204',1),('ac758be7-3ee2-4ae5-affe-8bc9173d9a96','7dc6c3918e99668b9b6b8b4c32ee0800301baca41738d1e58c6938dc8da7d14b','2024-11-30 18:49:47.077','20241130184944_init',NULL,NULL,'2024-11-30 18:49:45.002',1),('fae219fa-6622-4e7c-adaa-a58665483664','5e84ab2d4605ae94c09ae828cfa648b56c35538e7510ea7b809853d399d4fd34','2024-12-18 16:42:20.697','20241218164219_agregar_estado',NULL,NULL,'2024-12-18 16:42:19.952',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'railway'
--

--
-- Dumping routines for database 'railway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-03 12:07:10
