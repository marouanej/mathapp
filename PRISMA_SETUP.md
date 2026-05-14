# Prisma + PostgreSQL

## 1. Variables d environnement

Utilise `DATABASE_URL` dans `.env.local`.

Exemple :

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
```

## 2. Installer les dependances

```bash
npm install
```

## 3. Generer le client Prisma

```bash
npm run prisma:generate
```

## 4. Synchroniser le schema

```bash
npm run prisma:push
```

## 5. Lancer l application

```bash
npm run dev
```
