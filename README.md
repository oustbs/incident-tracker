# Test Technique — Incident Tracker

**Veuillez attentivement lire toutes les consignes avant de commencer le test.**

## Contexte

Vous travaillez sur une application de supervision réseau en **Next.js 15** (App Router). L'architecture suit un pattern **BFF** (Backend For Frontend) : le navigateur ne communique jamais directement avec l'API. Toutes les données transitent par des routes en /api Next.js (`src/app/api/`) qui tapent ensuite sur l'API.

Un premier développeur a implémenté le module de gestion des incidents (`src/app/incidents/`). Le code fonctionne, et c'est sur cette base que vous allez ajouter de nouvelles fonctionnalités.

## Setup

```bash
npm install
npm run dev
```

`npm run dev` lance **les deux processus** (Next.js + mock backend) dans le même terminal, préfixés en couleur.
Un seul `Ctrl+C` les arrête tous les deux.

- **Frontend :** http://localhost:3000/incidents
- **Mock API :** http://localhost:4000
- **Variable d'env :** `API_BASE_URL=http://localhost:4000` (configurée dans `.env.local`)

Si besoin de les lancer séparément (pour debug) : `npm run dev:next` et `npm run dev:mock`.

## Stack

- Next.js 15 (App Router, TypeScript strict)
- TanStack Query v5 (configuré dans `src/providers.tsx`)
- Zod
- Tailwind CSS + shadcn/ui (`Button`, `Badge`, `Dialog`, `Select`, `Input`, `Textarea`, `Skeleton`, `Separator`)
- Lucide React (icônes)
- Sonner (toasts)

---

## A FAIRE — Nouvelles fonctionnalités (1h30)

> **C'est le cœur du test.** Concentrez-vous d'abord sur ces fonctionnalités — c'est sur elles que vous serez principalement évalué(e).

### 1. Rafraîchissement automatique de la liste

- La liste doit se rafraîchir automatiquement toutes les **10 secondes**
- Le rafraîchissement doit être **silencieux** (pas de spinner / flash blanc à chaque poll)
- Les actions utilisateur (filtre, pagination) doivent afficher un loading normal

### 2. Amélioration de la section commentaires

- Pagination des commentaires (le backend supporte `?page=&limit=`)
- Ajout d'un commentaire avec confirmation utilisateur (toast de confirmation / erreur)
- Mettre en place un test unitaire (s'il vous reste du temps)

### Bonus (optionnel)

En lisant le code existant, vous remarquerez peut-être des points perfectibles (qualité, architecture, sécurité). Si **et seulement si** les fonctionnalités ci-dessus sont terminées, vous pouvez en corriger quelques-uns et les mentionner dans votre note technique. Ce n'est **pas attendu** et ne doit pas se faire au détriment des fonctionnalités.

---

## API Backend (port 4000)

### `GET /v1/incidents`

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page (default: 1) |
| `limit` | number | Par page (default: 10) |
| `status` | string | Filtre : `open`, `inProgress`, `resolved` |
| `siteCode` | string | Recherche partielle sur le code site |

**Réponse :**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Perte de signal site Marseille Nord",
      "status": "open",
      "siteCode": "MRS-N01",
      "createdAt": "2026-04-24T14:00:00Z",
      "assignedTo": null,
      "commentCount": 2
    }
  ],
  "total": 12,
  "currentPage": 1,
  "filteredCount": 12
}
```

### `GET /v1/incidents/:id`

```json
{
  "data": {
    "id": 1,
    "title": "...",
    "description": "...",
    "status": "open",
    "siteCode": "MRS-N01",
    "latitude": "43.3096",
    "longitude": "5.3698",
    "createdAt": "2026-04-24T14:00:00Z",
    "assignedTo": null
  }
}
```

### `PATCH /v1/incidents/:id`

**Body :** `{ "status": "inProgress" }`

**Règle métier :** un incident `resolved` ne peut pas être repassé directement à `open`.
Il doit d'abord retourner à `inProgress`. Toute transition interdite renvoie `409 Conflict` :

```json
{ "code": "INVALID_STATUS_TRANSITION", "message": "..." }
```

### `GET /v1/incidents/:id/comments?page=1&limit=20`

```json
{
  "data": [
    { "id": 101, "author": "tech@company.com", "message": "...", "createdAt": "..." }
  ],
  "total": 5,
  "currentPage": 1,
  "filteredCount": 5
}
```

### `POST /v1/incidents/:id/comments`

**Body :** `{ "author": "email@company.com", "message": "Mon commentaire" }`
**Réponse :** `201 Created`

---

## Critères d'évaluation

L'évaluation porte **avant tout sur les deux fonctionnalités demandées** : exactitude du comportement (refresh silencieux, loading sur action utilisateur, pagination, toasts), bonne utilisation de TanStack Query (cache, états de chargement, invalidation) et qualité du code ajouté.

### Conseils

- **Lisez le code existant avant de coder** pour comprendre les conventions en place et vous appuyer dessus.
- **Expliquez vos choix non évidents**, dans le code (commentaires sur les décisions structurelles) ou dans un `NOTES.md` court.
- **Utilisez les composants `shadcn/ui` déjà installés** au lieu d'en recréer.

## Livrables attendus
- Archive Git avec un historique de commits propre.
- Note technique : Un court paragraphe justifiant les choix techniques et la procédure pour lancer un test unitaire.