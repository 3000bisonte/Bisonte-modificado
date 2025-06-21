-- Tabla de ciudades
CREATE TABLE ciudades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL
);

-- Tabla de remitentes
CREATE TABLE remitentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    celular VARCHAR(15) NOT NULL,
    direccion_recogida VARCHAR(255) NOT NULL,
    detalle_direccion VARCHAR(255) DEFAULT NULL,  -- Apartamento/Torre/Conjunto
    recomendaciones TEXT DEFAULT NULL
);

-- Tabla de destinatarios
CREATE TABLE destinatarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    celular VARCHAR(15) NOT NULL,
    direccion_entrega VARCHAR(255) NOT NULL
);

-- Tabla de tipos de productos
CREATE TABLE tipos_producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

-- Tabla de envíos
CREATE TABLE envios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remitente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    ciudad_origen_id INT NOT NULL,
    ciudad_destino_id INT NOT NULL,
    tipo_envio VARCHAR(50) NOT NULL,
    alto DECIMAL(5,2) NOT NULL,
    ancho DECIMAL(5,2) NOT NULL,
    largo DECIMAL(5,2) NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    valor_declarado DECIMAL(10,2) NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    recomendaciones TEXT DEFAULT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (remitente_id) REFERENCES remitentes(id),
    FOREIGN KEY (destinatario_id) REFERENCES destinatarios(id),
    FOREIGN KEY (ciudad_origen_id) REFERENCES ciudades(id),
    FOREIGN KEY (ciudad_destino_id) REFERENCES ciudades(id)
);

-- Relación entre envíos y tipos de producto
CREATE TABLE envio_tipo_producto (
    envio_id INT NOT NULL,
    tipo_producto_id INT NOT NULL,
    FOREIGN KEY (envio_id) REFERENCES envios(id),
    FOREIGN KEY (tipo_producto_id) REFERENCES tipos_producto(id),
    PRIMARY KEY (envio_id, tipo_producto_id)
);
