// Mejoras para el guardado de datos de usuario en PostgreSQL
// Asegura que no se dupliquen registros entre Google Auth y Email/Password

import prisma from './prisma.js';
import { hashPassword } from './security.js';

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
      where: { email: normalizedEmail },
      include: {
        _count: {
          select: {
            historial_envio: true
          }
        }
      }
    });

    if (existingUser) {
      console.log(`[UserManager] Usuario existente encontrado - ID: ${existingUser.id}`);
      
      // Si el usuario existe y está tratando de registrarse por password pero ya tiene Google
      if (authMethod === 'email' && !existingUser.password && password) {
        console.log(`[UserManager] Vinculando password a cuenta Google existente`);
        
        const hashedPassword = await hashPassword(password);
        const updatedUser = await prisma.usuarios.update({
          where: { email: normalizedEmail },
          data: {
            password: hashedPassword,
            nombre: nombre || existingUser.nombre,
            celular: celular || existingUser.celular,
            ciudad: ciudad || existingUser.ciudad,
            emailVerified: true, // Si ya tenía Google, está verificado
            lastLoginAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        return {
          user: updatedUser,
          action: 'linked_password_to_google',
          message: 'Password vinculado a cuenta Google existente'
        };
      }
      
      // Si el usuario existe y está usando Google pero ya tiene password
      if (authMethod === 'google' && existingUser.password) {
        console.log(`[UserManager] Actualizando datos de Google en cuenta con password`);
        
        const updatedUser = await prisma.usuarios.update({
          where: { email: normalizedEmail },
          data: {
            nombre: googleData?.name || existingUser.nombre,
            emailVerified: true, // Google siempre está verificado
            lastLoginAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        return {
          user: updatedUser,
          action: 'updated_google_data',
          message: 'Datos de Google actualizados en cuenta existente'
        };
      }
      
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
 * Función específica para manejar autenticación Google
 * Se usa desde el callback de NextAuth
 */
export async function handleGoogleAuth(googlePayload) {
  const { email, name, picture, email_verified } = googlePayload;
  
  if (!email_verified) {
    throw new Error('Email no verificado por Google');
  }
  
  try {
    const result = await upsertUser({
      email,
      nombre: name,
      googleData: {
        name,
        picture,
        verified: email_verified
      }
    }, 'google');
    
    console.log(`[GoogleAuth] ${result.action} para ${email}`);
    
    return {
      id: String(result.user.id),
      email: result.user.email,
      name: result.user.nombre || result.user.email,
      role: result.user.esAdministrador ? 'admin' : result.user.esRecolector ? 'collector' : 'user',
      emailVerified: result.user.emailVerified,
      passwordVersion: result.user.passwordVersion ?? 0,
      method: 'google'
    };
    
  } catch (error) {
    console.error('[GoogleAuth] Error:', error);
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

/**
 * Verificar y limpiar duplicados existentes (usar con precaución)
 * Esta función es solo para mantenimiento
 */
export async function cleanupDuplicateUsers(dryRun = true) {
  console.log(`[Cleanup] Iniciando ${dryRun ? 'simulación' : 'limpieza real'} de duplicados`);
  
  try {
    // Buscar emails duplicados
    const duplicates = await prisma.usuarios.groupBy({
      by: ['email'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    if (duplicates.length === 0) {
      console.log('[Cleanup] No se encontraron duplicados');
      return { cleaned: 0, kept: 0 };
    }
    
    console.log(`[Cleanup] Encontrados ${duplicates.length} emails duplicados`);
    
    let cleanedCount = 0;
    let keptCount = 0;
    
    for (const duplicate of duplicates) {
      const users = await prisma.usuarios.findMany({
        where: { email: duplicate.email },
        orderBy: [
          { lastLoginAt: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          historial_envio: true
        }
      });
      
      console.log(`[Cleanup] Procesando ${users.length} duplicados para ${duplicate.email}`);
      
      // Mantener el usuario más reciente o con más actividad
      const userToKeep = users[0];
      const usersToDelete = users.slice(1);
      
      console.log(`[Cleanup] Manteniendo usuario ID: ${userToKeep.id} (último login: ${userToKeep.lastLoginAt})`);
      
      if (!dryRun) {
        // Transferir datos importantes antes de eliminar
        for (const userToDelete of usersToDelete) {
          if (userToDelete.historial_envio.length > 0) {
            await prisma.historial_envio.updateMany({
              where: { usuarioId: userToDelete.id },
              data: { usuarioId: userToKeep.id }
            });
          }
          
          await prisma.usuarios.delete({
            where: { id: userToDelete.id }
          });
          
          cleanedCount++;
          console.log(`[Cleanup] Eliminado usuario duplicado ID: ${userToDelete.id}`);
        }
      } else {
        cleanedCount += usersToDelete.length;
        usersToDelete.forEach(user => {
          console.log(`[Cleanup] (SIMULACIÓN) Eliminaría usuario ID: ${user.id} con ${user.historial_envio.length} envíos`);
        });
      }
      
      keptCount++;
    }
    
    console.log(`[Cleanup] Finalizado - Mantenidos: ${keptCount}, Eliminados: ${cleanedCount}`);
    
    return { cleaned: cleanedCount, kept: keptCount };
    
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    throw error;
  }
}

export default {
  upsertUser,
  handleGoogleAuth,
  handleEmailAuth,
  cleanupDuplicateUsers
};