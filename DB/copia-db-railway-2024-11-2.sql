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
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Destinatario`
--

LOCK TABLES `Destinatario` WRITE;
/*!40000 ALTER TABLE `Destinatario` DISABLE KEYS */;
INSERT INTO `Destinatario` VALUES (1,'Andrés Mauricio','Gallo','CC','1010185940','lopezalirioda@hotmail.es','3144395525','DG 38 # 19 - 82','torre 6, apto 7',1),(2,'Andrés Mauricio','Gallo','CC','1010185940','lopezalirioda@hotmail.es','3144395525','DG 38 # 19 - 82','torre 6, apto 7',1),(3,'Andrés Mauricio','Gallo','CC','1010185940','lopezalirioda@hotmail.es','3144395525','DG 38 # 19 - 82\nDG 38 # 19 - 82','torre 6, apto 7',1),(4,'Andrés Mauricio','Gallo Amado','CC','1010185904','qompandre@hotmail.es','3128978777','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(5,'Andrés Mauricio','Gallo Amado','CC','1010185904','qompandre@hotmail.es','3197868977','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(6,'Daniel','R','CC','1010184','roboticswarpdesarrollador@gmail.com','3144395526','Callé 7','To 9 ',1),(7,'Eduardo','Forero','','Hg','gokufor399@gmail.com','3224265','Cll 152b # 106b 52  casa 9A','Cll 152b # 106b 52  casa 9A',1),(8,'Andrés Mauricio','Gallo Amado','CC','1010185904','qompandre@hotmail.es','3148766746','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(9,'Andrés Mauricio','Gallo Amado','CC','1010185940','qompandre@hotmail.es','3144397737','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(10,'Andrés Mauricio','Gallo Amado','CC','1010185940','qompandre@hotmail.es','3144396626','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(11,'chakichan','La rock','CC','1010184','roboticswarpdesarrollador@gmail.com','3144395526','Calle 9 ','To 9',1),(12,'H','Bb','CC','23444','gokufor399@gmail.com','3224265','Calle 95 ',NULL,1),(13,'Andrés Mauricio','Gallo Amado','CC','1010185904','qompandre@hotmail.es','3144398838','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(14,'Andrés Mauricio','Gallo Amado','CC','1010185904','lopezalirioda@hotmail.es','3144396626','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(15,'Andrés Mauricio','Gallo Amado','CC','1010185904','qompandre@hotmail.es','W@W.COM','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(16,'Andrés Mauricio','Gallo Amado','NIT','1010185904','lopezalirioda@hotmail.es','3144387723','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(17,'Andrés Mauricio','Gallo Amado','NIT','1030640184','lopezalirioda@hotmail.es','3144397737','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(18,'Miriam','Y','NIT','10101111111111','roboticswarpdesarrollador@gmail.com','3220000000','Calle 9 ','to marte',1),(19,'Miriam','Y','NIT','101009876643','roboticswarpdesarrollador@gmail.com','3220000000','Calle','to marte',1),(20,'Andrés Mauricio','Gallo Amado','NIT','1030640184','qompandre@hotmail.es','3144396676','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(21,'Andrés Mauricio','Gallo Amado','NIT','1030640184','lopezalirioda@hotmail.es','3144396626','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(22,'Eduardo','Forero','CC','23444','gokufor399@gmail.com','3224265','Cll 152b # 106b 52  casa 9A','Cll 152b # 106b 52  casa 9A',1),(23,'Eduardo','Forero','CC','23444','gokufor399@gmail.com','3224265','Cll 152b # 106b 52  casa 9A','Cll 152b # 106b 52  casa 9A',1),(24,'Andrés Mauricio','Gallo Amado','CC','1030640184','qompandre@hotmail.es','3222959089','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(25,'Andrés Mauricio','Gallo Amado','CE','1010185904','qompandre@hotmail.es','3222959089','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(26,'Andrés Mauricio','Gallo Amado','CC','1010185111','h@h.com','3144387726','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(27,'Andrés Mauricio','Gallo Amado','CC','1010185111','qompandre@hotmail.es','3144396636','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(28,'Andrés Mauricio','Gallo Amado','CC','1010185904','lopezalirioda@hotmail.es','314438763','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(29,'Andrés Mauricio','Gallo Amado','NIT','1030640184','lopezalirioda@hotmail.es','314673763','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(30,'Andrés Mauricio','Gallo Amado','CC','1030640184','lopezalirioda@hotmail.es','3143876363','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(31,'Andrés Mauricio','Gallo Amado','CC','1030640184','q@q.com','3147865463','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(32,'Andrés Mauricio','Gallo Amado','CC','1010185904','q@q.com','3144396626','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(33,'Andrés Mauricio','Gallo Amado','CC','1030640184','q@q.com','3216755432','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(34,'Andrés Mauricio','Gallo Amado','NIT','1030640184','q@q.com','3146763221','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(35,'Miriam','Y','CC','101009876643','roboticswarpdesarrollador@gmail.com','3220000000','Calle 9 ','to marte',1),(36,'Andrés Mauricio','Gallo Amado','NIT','1010185904','lopezalirioda@hotmail.es','314387321','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(37,'Miriam','Y','CC','10101383','roboticswarpdesarrollador@gmail.com','3220000000','We','to marte',1),(38,'Eduardo','Forero','CC','23444','gokufor399@gmail.com','3224265','Cll 152b # 106b 52  casa 9A','Cll 152b # 106b 52  casa 9A',1),(39,'Andrés Mauricio','Gallo Amado','CC','10101111111111','lopezalirioda@hotmail.es','31443977327','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(40,'Andrés ','G','CC','101009876643','roboticswarpdesarrollador@gmail.com','3144395525','T','T',1),(41,'Andrés ','G','CC','101009876643','roboticswarpdesarrollador@gmail.com','3144395525','Y','H',1),(42,'Andrés Mauricio','Gallo Amado','CC','1010185904','lopezalirioda@hotmail.es','314397772','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1),(43,'Miriam','G','CC','101009876643','roboticswarpdesarrollador@gmail.com','3144395525','R','to marte',1),(44,'Andrés Mauricio','Gallo Amado','CC','1030640184','juandaza@gmail.com','3197868977','DG 38 # 19 - 82','DG 38 # 19 - 82',1),(45,'Eduardo','Forero','CC','23444','gokufor399@gmail.com','3224265','Cll 152b # 106b 52  casa 9A','Cll 152b # 106b 52  casa 9A',1),(46,'Andrés Mauricio','Gallo Amado','NIT','1010185904','lopezalirioda@hotmail.es','314397272','DG 38 # 19 - 82\nDG 38 # 19 - 82','DG 38 # 19 - 82',1);
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
  `NumeroGuia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Origen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Destino` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Destinatario` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaSolicitud` datetime DEFAULT NULL,
  `PerfilId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PerfilId` (`PerfilId`),
  CONSTRAINT `HistorialEnvio_PerfilId_fkey` FOREIGN KEY (`PerfilId`) REFERENCES `Perfil` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `HistorialEnvio`
--

LOCK TABLES `HistorialEnvio` WRITE;
/*!40000 ALTER TABLE `HistorialEnvio` DISABLE KEYS */;
INSERT INTO `HistorialEnvio` VALUES (1,'GUIA-20241102-V7K5','1327994845','Bogotá','Bogotá','Andrés Mauricio Gallo Amado',NULL,13);
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
  `tipo_documento` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion_recogida` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detalle_direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recomendaciones` text COLLATE utf8mb4_unicode_ci,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Perfil_correo_key` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Perfil`
--

LOCK TABLES `Perfil` WRITE;
/*!40000 ALTER TABLE `Perfil` DISABLE KEYS */;
INSERT INTO `Perfil` VALUES (1,'Andrés Mauricio','CC','1010185904','3144396626','G','G','G',NULL,NULL),(2,'Julian Garcia','CC','1010185777','3144397765','Calle 80 # 67 - 34','To 7, apto 9','Fragil',NULL,NULL),(3,'Luis Solano','NIT','1010767777','3145555555','mrte','casa 1','rel',NULL,NULL),(13,'Miriam','CC','10101111111111','3220000000','calle jupiter','to marte','x','roboticswarpdesarrollador@gmail.com','Mauricio Amado'),(14,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'gokufor399@gmail.com','Goku For'),(15,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'bogotazzzo@hotmail.com','Eduardo Forero'),(16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'3000bisonte@gmail.com','German Eduardo Forero'),(17,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1klikck@gmail.com','KLIKCK SERVICIOS'),(18,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'desarrollodesoftwarehefziba@gmail.com','Mayerly Diaz');
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
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Remitente`
--

LOCK TABLES `Remitente` WRITE;
/*!40000 ALTER TABLE `Remitente` DISABLE KEYS */;
INSERT INTO `Remitente` VALUES (1,'Andrés Mauricio','CC','28','3144395500','calle 45','to 6 apto 6','x'),(2,'Vandame','CC','27','3197868977','Calle 127 # 34 - 55','To 7, apto 104','x'),(3,'Andrés Mauricio','CC','26','3144395500','calle 56','to 7, apto 7','x'),(4,'Daniel','CC','25','3144395526','Calle 9 ','To 9',''),(5,'','','24','','',NULL,''),(6,'Andrés Mauricio','CC','23','3222959089','calle 3','to 8','x'),(7,'Andrés Mauricio','CC','22','3222959089','CALLE 3','TO 6','X'),(8,'Andrés Mauricio','CC','21','3222959089','CALLE 5','TO 6','X'),(9,'Andrés Mauricio','CC','20','3222959089','calle 4','7','x'),(10,'Daniel','CC','19','3144395526','Calle 9 ','To 9 ','X'),(11,'','','18','','',NULL,''),(12,'','','17','','',NULL,''),(13,'','','16','','',NULL,''),(14,'','CC','15','','','Y',''),(15,'Andrés Mauricio','CC','14','3222959089','calle3','to 9','x'),(16,'Andrés Mauricio','CC','13','3156543521','calle 5','to 7','x'),(17,'Andrés Mauricio Gallo Amado','NIT','12','3144395500','v','b','b'),(18,'Andrés Mauricio Gallo Amado','CC','11','3144395500','cal','d','c'),(19,'Andrés Mauricio','CC','10','3197868977','g','h','h'),(20,'Andrés Mauricio','CC','9','3144396627','c','c','c'),(21,'Andrés Mauricio Gallo Amado','CC','8','3148829827','c','c','c'),(22,'Andrés ','CC','7','314487372','e','r','r'),(23,'Andrés Mauricio','CC','6','314458843','f','f','f'),(24,'Andrés Mauricio','CC','5','314458843','f','f','f'),(25,'Andrés Mauricio','CC','4','341676525','U','U','U'),(26,'Julian Garcia','CC','3','3144397765','Calle 80 # 67 - 34','To 7, apto 9','Fragil'),(27,'Miriam','CC','2','3222959089','calle jupiter','to marte','x'),(28,'Miriam','CC','1','3222959089','calle jupiter','to marte','x'),(29,'Miriam','CC','1010185940','3222959089','calle jupiter','to marte','x'),(30,'Miriam','CC','1010185941','3222959089','calle jupiter','to marte','x'),(31,'Miriam','CC','10101010101010','3220000000','calle jupiter','to marte','x'),(32,'Miriam','CC','10101777711119','3220000000','calle jupiter','to marte','x'),(33,'Miriam','CC','101009876643','3220000000','calle jupiter','to marte','x'),(34,'Miriam','CC','101013334333','3220000000','calle jupiter','to marte','x'),(35,'','CC','23444','3224265','CRA 1#1','Cll 152b # 106b 52  casa 9A','Bvv'),(36,'','CC','','','','',''),(37,'Miriam','CC','10101833333','3220000000','calle jupiter','to marte','x'),(38,'Andrés Mauricio','CC','1033444444','3144395500','calle 5','apto 9','x'),(39,'Miriam','CC','101012662277','3220000000','calle jupiter','to marte','x'),(40,'Miriam','CC','101011234567','3220000000','calle jupiter','to marte','x'),(41,'Miriam','CC','10101222222','3220000000','calle jupiter','to marte','x'),(42,'Miriam','CC','10101000000','3220000000','calle jupiter','to marte','x'),(43,'Miriam','CC','1010199999','3220000000','calle jupiter','to marte','x'),(44,'Miriam','CC','101088888','3220000000','calle jupiter','to marte','x'),(45,'Miriam','CC','10101445664','3220000000','calle jupiter','to marte','x'),(46,'Miriam','CC','101017789665','3220000000','calle jupiter','to marte','x'),(47,'Miriam','CC','101000000','3220000000','calle jupiter','to marte','x'),(48,'Miriam','CC','1010166564433','3220000000','calle jupiter','to marte','x'),(49,'Miriam','CC','2345698123','3220000000','calle jupiter','to marte','x'),(50,'Miriam','CC','10101383','3220000000','calle jupiter','to marte','x'),(51,'Miriam','CC','10101111111111','3220000000','calle jupiter','to marte','x'),(52,'Miriam','CC','1010090909099','3220000000','calle jupiter','to marte','x'),(53,'Miriam','CC','1010098755','3220000000','calle jupiter','to marte','x'),(54,'Miriam','CC','101011998771','3220000000','calle jupiter','to marte','x'),(55,'Eduardo','CC','234441','3224265','CRA 1#1','Cll 152b # 106b 52  casa 9A','Delicado'),(56,'Miriam','CC','101090990876','3220000000','calle jupiter','to marte','x');
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
INSERT INTO `_prisma_migrations` VALUES ('130f8511-611e-41f3-b7d6-66736f8ed9bd','7163057b0d918ac8b283754c21e1bfb807234a8b0fb8751eec3a3ee7508fd89e','2024-10-24 20:05:10.034','20241024200505_historial_anvios',NULL,NULL,'2024-10-24 20:05:08.074',1),('21c78185-0690-4d9a-81e7-f38d3505dd06','7bdf93c27014ab666f7bb24ed026a2ba4fddad0d8568a1257a4e879c395d11b4','2024-10-20 04:16:51.362','20241020041649_agregar_tabla_perfil',NULL,NULL,'2024-10-20 04:16:50.481',1),('30f54357-9ab1-46a2-9923-b5ec5cefafd1','09cc6fdbed558813d5a1dbdbc391293d405f4a7393a033a259deff0dcfc8ca3b','2024-10-21 00:45:48.569','20241021004547_defaul_campos_perfil',NULL,NULL,'2024-10-21 00:45:47.769',1),('509dec50-2bd8-4f1d-a558-21062a62358d','f8a02c9b1b1453b3e8de584e0129d626214ed7b468863f60d7d8c2f135ae25e1','2024-11-03 00:33:56.723','20241103003354_modificar_numguia_a_string',NULL,NULL,'2024-11-03 00:33:55.722',1),('6a915062-ffd3-4215-9b3b-7c27601dc3a6','ca0892baad6ea0de6e084238c7fabc700f46561335809ea53f5a0947deb10231','2024-10-17 22:55:21.649','20241017225519_init',NULL,NULL,'2024-10-17 22:55:20.014',1),('958e06ea-4410-4125-b322-bf70aeffa77a','6bd373f1d79301907195bf07a30b16dde29d23bf22a7e51baced7f156a9ec64a','2024-10-21 01:03:58.679','20241021010357_agregar_email_unique',NULL,NULL,'2024-10-21 01:03:57.902',1),('a74f237a-8682-4544-ac97-dedd5a2cf31e','d9b21541b9bc153cdbe7d7a3a1a1af89c10d4924187cf2199c7fade0d2d16d22','2024-10-21 00:25:45.520','20241021002544_agregar_email_y_nickname',NULL,NULL,'2024-10-21 00:25:44.768',1),('c65afa56-07c3-46d9-b78e-4dc7ef12d838','7a9e4c1531bc0bd0432d7bbcf97a12aaa614fdc2f2227945197bf0a23dad91c5',NULL,'20241103004244_agregar_fecha_automatica_h_envios','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20241103004244_agregar_fecha_automatica_h_envios\n\nDatabase error code: 1067\n\nDatabase error:\nInvalid default value for \'FechaSolicitud\'\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20241103004244_agregar_fecha_automatica_h_envios\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name=\"20241103004244_agregar_fecha_automatica_h_envios\"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226',NULL,'2024-11-03 00:42:45.566',0),('ca70a410-105e-46fd-a97a-a11c42e5de28','baec6b75b2bd2325c83b6e60e5c7c9c7d9e3b61d531570f8ecf7d77093f53a75','2024-10-21 02:40:57.769','20241021024056_unique_numero_doc',NULL,NULL,'2024-10-21 02:40:57.003',1);
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

-- Dump completed on 2024-11-02 19:53:06
