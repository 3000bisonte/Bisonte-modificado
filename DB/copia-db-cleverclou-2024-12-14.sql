-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: b5up7f9nxnjpvro4kyqr-mysql.services.clever-cloud.com    Database: b5up7f9nxnjpvro4kyqr
-- ------------------------------------------------------
-- Server version	8.0.22-13

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'a05a675a-1414-11e9-9c82-cecd01b08c7e:1-491550428,
a38a16d0-767a-11eb-abe2-cecd029e558e:1-497114416';

--
-- Table structure for table `Ciudad`
--

DROP TABLE IF EXISTS `Ciudad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ciudad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_postal` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_documento` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion_entrega` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalleDireccion` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noProhibidos` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Destinatario`
--

LOCK TABLES `Destinatario` WRITE;
/*!40000 ALTER TABLE `Destinatario` DISABLE KEYS */;
INSERT INTO `Destinatario` VALUES (1,'Miriam','Rodríguez ','CC','10101857765','qompandre@misena.edu.co','3125653562','X','E',1),(2,'Enrique ','Rodríguez ','CC','10101857765','qompandre@misena.edu.co','3125653562','T','to marte',1),(3,'Miriam','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','W','R',1),(4,'Miriam','Rodríguez ','CC','10101111111111','qompandre@misena.edu.co','3220000000','E','T',1),(5,'Miriam','T','NIT','10101111111111','qompandre@misena.edu.co','3220000000','R','T',1),(6,'Miriam','Rodríguez ','NIT','10101857765','qompandre@misena.edu.co','3125653562','R','T',1),(7,'Andrés Mauricio','Gallo Amado','CC','1010185904','lopezalirioda@hotmail.es','3144398373','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(8,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','F','E',1),(9,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','E','R',1),(10,'Andrés Mauricio','Gallo Amado','CC','1030640184','lopezalirioda@hotmail.es','3144576352','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(11,'Andrés Mauricio','Gallo Amado','CC','1030640184','roboticswarpdesarrollador@gmail.com','314493626','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(12,'Andrés Mauricio','Gallo Amado','NIT','1030640184','lopezalirioda@hotmail.es','3144983822','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(13,'Andrés Mauricio','Gallo Amado','NIT','1010185111','q@q.com','419876252','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(14,'Miriam','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','R',1),(15,'Miriam','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','R',1),(16,'Enrique ','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','R','R',1),(17,'Enrique ','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','W','R',1),(18,'Enrique ','Rodríguez ','NIT','10101111111111','qompandre@misena.edu.co','3125653562','E','R',1),(19,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','D','F',1),(20,'Enrique ','T','NIT','1010185789','qompandre@misena.edu.co','3125653562','D','E',1),(21,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(22,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(23,'Enrique ','T','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(24,'Miriam','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(25,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','T',0),(26,'Mayerly','Y','CC','1030640184','q@q.com','3214563254','2','Calle7',1),(27,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','Q','R',1),(28,'Enrique ','T','CC','1010185789','qompandre@misena.edu.co','3125653562','12','F',1),(29,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(30,'Miriam','Rodríguez ','CE','1010185789','qompandre@misena.edu.co','3125653562','W','R',1),(31,'Enrique ','T','NIT','10101111111111','qompandre@misena.edu.co','3125653562','R','E',1),(32,'Enrique ','Rodríguez ','NIT','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(33,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(34,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(35,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(36,'Miriam','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(37,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','E','to marte',1),(38,'Enrique ','Rodríguez ','CC','1010185789','qompandre@misena.edu.co','3125653562','W','to marte',1),(39,'Enrique ','T','CC','1010185789','qompandre@misena.edu.co','3125653562','W','R',1);
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
  `tipo_envio` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alto` decimal(5,2) NOT NULL,
  `ancho` decimal(5,2) NOT NULL,
  `largo` decimal(5,2) NOT NULL,
  `peso` decimal(5,2) NOT NULL,
  `valor_declarado` decimal(10,2) NOT NULL,
  `costo_total` decimal(10,2) NOT NULL,
  `recomendaciones` text COLLATE utf8mb4_unicode_ci,
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
  `NumeroGuia` bigint DEFAULT NULL,
  `paymentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Origen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Destino` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Destinatario` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaSolicitud` datetime DEFAULT NULL,
  `PerfilId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PerfilId` (`PerfilId`),
  CONSTRAINT `HistorialEnvio_PerfilId_fkey` FOREIGN KEY (`PerfilId`) REFERENCES `Perfil` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `HistorialEnvio`
--

LOCK TABLES `HistorialEnvio` WRITE;
/*!40000 ALTER TABLE `HistorialEnvio` DISABLE KEYS */;
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
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_documento` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion_recogida` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detalle_direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recomendaciones` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Perfil_correo_key` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Perfil`
--

LOCK TABLES `Perfil` WRITE;
/*!40000 ALTER TABLE `Perfil` DISABLE KEYS */;
INSERT INTO `Perfil` VALUES (1,'das','sda','q@q.com','cc','10101920','31448373','5','6','6'),(2,'Enrique ','Mauricio Amado','roboticswarpdesarrollador@gmail.com','CC','1010185789','3125653562','Calle 9 ','to marte','X'),(3,'Mayer6','Mayerly Diaz','avivamaye16@gmail.com','CC','1030640166','3214563254','Calle 4','Calle7','C');
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
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_documento` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion_recogida` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle_direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recomendaciones` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Remitente_numero_documento_key` (`numero_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Remitente`
--

LOCK TABLES `Remitente` WRITE;
/*!40000 ALTER TABLE `Remitente` DISABLE KEYS */;
INSERT INTO `Remitente` VALUES (1,'Enrique ','CC','1010185789','3125653562','Calle 9 ','to marte','X'),(2,'Mayer6','CC','1030640166','3214563254','Calle 4','Calle7','C');
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
  `descripcion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
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
INSERT INTO `_prisma_migrations` VALUES ('ac758be7-3ee2-4ae5-affe-8bc9173d9a96','7dc6c3918e99668b9b6b8b4c32ee0800301baca41738d1e58c6938dc8da7d14b','2024-11-30 18:49:47.077','20241130184944_init',NULL,NULL,'2024-11-30 18:49:45.002',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'b5up7f9nxnjpvro4kyqr'
--

--
-- Dumping routines for database 'b5up7f9nxnjpvro4kyqr'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-14 17:07:52
