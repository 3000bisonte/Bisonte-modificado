// Versión simplificada del userManager para testing sin dependencias server-only
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Hash password function
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Función mejorada para crear o actualizar usuario con validación de duplicados
 * Maneja tanto registro por email/password como autenticación Google
 */
export async function upsertUser(userData, authMethod = 'email') {
  const { email, password, nombre, celular, ciudad, googleData } = userData;
  
  try {
    console.log(`[UserManager] Procesando usuario: ${email} (método: ${authMethod})`);
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      console.log(`[UserManager] Usuario existente encontrado - ID: ${existingUser.id}`);
      
      // Actualización estándar de datos existentes
      const updateData = {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      };
      
      // Solo actualizar campos si se proporcionan nuevos valores
      if (nombre && nombre !== existingUser.nombre) updateData.nombre = nombre;
      if (celular && celular !== existingUser.celular) updateData.celular = celular;
      if (ciudad && ciudad !== existingUser.ciudad) updateData.ciudad = ciudad;
      
      // Si es Google, asegurar que está verificado
      if (authMethod === 'google') {
        updateData.emailVerified = true;
      }
      
      const updatedUser = await prisma.usuarios.update({
        where: { email: normalizedEmail },
        data: updateData
      });
      
      return {
        user: updatedUser,
        action: 'updated_existing',
        message: 'Usuario existente actualizado'
      };
    }
    
    // Crear nuevo usuario
    console.log(`[UserManager] Creando nuevo usuario: ${normalizedEmail}`);
    
    const createData = {
      email: normalizedEmail,
      nombre: nombre || googleData?.name || normalizedEmail.split('@')[0],
      celular: celular || null,
      ciudad: ciudad || null,
      emailVerified: authMethod === 'google', // Google siempre verificado
      esAdministrador: false,
      esRecolector: false,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      failedLogins: 0
    };
    
    // Agregar password solo si se proporciona
    if (password) {
      createData.password = await hashPassword(password);
    }
    
    const newUser = await prisma.usuarios.create({
      data: createData
    });
    
    console.log(`[UserManager] Usuario creado exitosamente - ID: ${newUser.id}`);
    
    return {
      user: newUser,
      action: 'created_new',
      message: 'Nuevo usuario creado'
    };
    
  } catch (error) {
    console.error(`[UserManager] Error procesando usuario ${email}:`, error);
    
    // Si es error de email duplicado (aunque no debería pasar con upsert)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      throw new Error('Ya existe un usuario con este email');
    }
    
    throw error;
  }
}

/**
 * Función específica para manejar registro/login por email y password
 */
export async function handleEmailAuth(email, password, additionalData = {}) {
  const { nombre, celular, ciudad } = additionalData;
  
  try {
    const result = await upsertUser({
      email,
      password,
      nombre,
      celular,
      ciudad
    }, 'email');
    
    console.log(`[EmailAuth] ${result.action} para ${email}`);
    
    return {
      id: String(result.user.id),
      email: result.user.email,
      name: result.user.nombre || result.user.email,
      role: result.user.esAdministrador ? 'admin' : result.user.esRecolector ? 'collector' : 'user',
      emailVerified: result.user.emailVerified,
      method: 'email'
    };
    
  } catch (error) {
    console.error('[EmailAuth] Error:', error);
    throw error;
  }
}

export default {
  upsertUser,
  handleEmailAuth
};