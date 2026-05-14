import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { prisma } from './prisma';

const scryptAsync = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey.toString('hex'));
    });
  });

export const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await scryptAsync(password, salt);

  return {
    passwordHash,
    passwordSalt: salt,
  };
};

export const verifyPassword = async (password, passwordHash, passwordSalt) => {
  const derivedHash = await scryptAsync(password, passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(derivedHash, 'hex'), Buffer.from(passwordHash, 'hex'));
};

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const getUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  });
};

export const createUser = async ({ name, email, password, role }) => {
  const existing = await getUserByEmail(email);

  if (existing) {
    throw new Error('Un compte existe deja avec cette adresse email.');
  }

  const { passwordHash, passwordSalt } = await hashPassword(password);

  return prisma.user.create({
    data: {
      id: `user_${nanoid(10)}`,
      name: name.trim(),
      email: normalizeEmail(email),
      passwordHash,
      passwordSalt,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};
