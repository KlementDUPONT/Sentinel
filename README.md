# 🤖 Sentinel Discord Bot

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0--alpha.1-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14.16.3-7289DA)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production-success)

**Bot Discord multifonction avec système de modération, économie, niveaux et utilitaires**

[Installation](#-installation) • [Commandes](#-commandes) • [Configuration](#️-configuration) • [Déploiement](#-déploiement)

</div>

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Commandes](#-commandes)
- [Structure du projet](#-structure-du-projet)
- [Base de données](#-base-de-données)
- [Déploiement](#-déploiement)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## ✨ Fonctionnalités

### 🛡️ Modération
- **Avertissements** : Système de warns avec historique
- **Sanctions** : Ban, kick avec logs détaillés
- **Nettoyage** : Suppression de messages en masse
- **Logs automatiques** : Enregistrement de toutes les actions

### 💰 Économie
- **Système monétaire** : Balance + compte en banque
- **Récompenses** : Daily (24h) et work (1h)
- **Transactions** : Paiement entre utilisateurs
- **Classement** : Leaderboard des plus riches

### 📈 Système de niveaux
- **XP sur messages** : Gain automatique d'expérience
- **Niveaux progressifs** : Formule équilibrée
- **Notifications** : Annonce des level up
- **Classement** : Leaderboard des niveaux

### 🎮 Commandes fun
- **8ball** : Boule magique pour réponses
- **Coinflip** : Pile ou face
- **Dice** : Lancer de dés (6/12/20/100 faces)

### 🔧 Utilitaires
- **Informations** : Serveur, utilisateur, avatar
- **Aide interactive** : Menu avec sélection par catégorie
- **Ping** : Latence API et WebSocket

### ⚙️ Administration
- **Setup automatique** : Configuration complète en une commande
- **Configuration** : Personnalisation du serveur
- **Reload** : Rechargement des commandes à chaud

---

## 📦 Prérequis

- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.0.0
- **Git** (pour le déploiement)
- Un **bot Discord** créé sur le [Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/sentinel-bot.git
cd sentinel-bot
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Discord Configuration
DISCORD_TOKEN=votre_token_discord
DISCORD_CLIENT_ID=votre_client_id
OWNER_ID=votre_user_id

# Environment
NODE_ENV=development

# Server (pour Koyeb)
PORT=8000
```

> ⚠️ **Ne JAMAIS commit le fichier .env !** Il est dans .gitignore.

### 4. Lancer le bot

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

---

## ⚙️ Configuration

### Configuration automatique

Utilisez la commande `/setup` (requiert les permissions Administrateur) pour :
- ✅ Créer le rôle "Muted" avec permissions configurées
- ✅ Créer le salon "sentinel-logs" (privé)
- ✅ Créer le salon "bienvenue"
- ✅ Enregistrer la configuration en base de données

### Configuration manuelle

Utilisez `/config` pour personnaliser :

```
/config prefix:!           # Changer le préfixe (déprécié, slash commands)
/config welcome_channel:#bienvenue
/config log_channel:#logs
/config mute_role:@Muted
/config auto_role:@Membre
```

---

## 📖 Commandes

### 🛡️ Modération

| Commande | Description | Permissions |
|----------|-------------|-------------|
| `/ban <user> [reason]` | Bannir un membre | BAN_MEMBERS |
| `/kick <user> [reason]` | Expulser un membre | KICK_MEMBERS |
| `/warn <user> <reason>` | Avertir un membre | MODERATE_MEMBERS |
| `/warnings <user>` | Voir les avertissements | MODERATE_MEMBERS |
| `/clear <amount> [user]` | Supprimer des messages | MANAGE_MESSAGES |

### 💰 Économie

| Commande | Description | Cooldown |
|----------|-------------|----------|
| `/balance [user]` | Voir le solde | - |
| `/daily` | Récompense journalière | 24h |
| `/work` | Travailler pour gagner | 1h |
| `/pay <user> <amount>` | Payer un utilisateur | - |
| `/leaderboard [type]` | Classement richesse/niveaux | - |

### 📈 Niveaux

| Commande | Description |
|----------|-------------|
| `/rank [user]` | Voir niveau et XP |

### 🎲 Fun

| Commande | Description |
|----------|-------------|
| `/8ball <question>` | Poser une question à la boule magique |
| `/coinflip` | Lancer une pièce |
| `/dice [sides]` | Lancer un dé |

### 🔧 Utilitaires

| Commande | Description |
|----------|-------------|
| `/help [command]` | Menu d'aide interactif |
| `/ping` | Latence du bot |
| `/avatar [user]` | Afficher un avatar |
| `/userinfo [user]` | Infos sur un utilisateur |
| `/serverinfo` | Infos sur le serveur |

### ⚙️ Administration

| Commande | Description | Permissions |
|----------|-------------|-------------|
| `/setup` | Configuration automatique | ADMINISTRATOR |
| `/config <option> <value>` | Modifier la config | ADMINISTRATOR |
| `/reload <command>` | Recharger une commande | OWNER_ONLY |

---

## 📁 Structure du projet

```
sentinel-bot/
├── src/
│   ├── bot.js                      # Point d'entrée principal
│   ├── commands/                   # Commandes slash
│   │   ├── admin/                  # Commandes administrateur
│   │   ├── economy/                # Système d'économie
│   │   ├── fun/                    # Commandes amusantes
│   │   ├── levels/                 # Système de niveaux
│   │   ├── moderation/             # Outils de modération
│   │   └── utility/                # Utilitaires
│   ├── config/
│   │   └── config.js               # Configuration globale
│   ├── database/
│   │   └── migrations/             # Migrations SQL
│   │       └── 001_initial_schema.js
│   ├── events/                     # Événements Discord
│   │   ├── client/                 # ready, interactionCreate
│   │   ├── guild/                  # guildCreate, guildDelete
│   │   └── member/                 # memberAdd, memberRemove
│   ├── handlers/                   # Gestionnaires système
│   │   ├── CommandHandler.js       # Chargement commandes
│   │   ├── DatabaseHandler.js      # Gestion BDD
│   │   └── EventHandler.js         # Chargement événements
│   └── utils/
│       └── logger.js               # Système de logs
├── data/
│   └── sentinel.db                 # Base de données SQLite
├── .env                            # Variables d'environnement
├── .gitignore                      # Fichiers ignorés
├── package.json                    # Dépendances
└── README.md                       # Ce fichier
```

---

## 💾 Base de données

### Schéma SQLite

Le bot utilise **SQLite** avec 5 tables principales :

#### `guilds` - Configuration des serveurs
- Configuration par serveur (prefix, channels, roles)
- Activation/désactivation des modules

#### `users` - Données utilisateurs
- Balance et bank (économie)
- Level et XP (niveaux)
- Cooldowns (daily, work)

#### `warns` - Avertissements
- Historique des warnings
- Status actif/inactif
- Modérateur et raison

#### `tickets` - Système de tickets
- Gestion des tickets de support
- Status open/closed
- Historique complet

#### `mod_logs` - Logs de modération
- Historique de toutes les actions
- Ban, kick, warn, mute
- Durées et raisons

### Migrations

Les migrations sont automatiques au démarrage :
- Détection des migrations manquantes
- Exécution séquentielle
- Historique dans table `migrations`

---

## 🌐 Déploiement

### Déploiement local

```bash
npm start
```

### Déploiement sur Koyeb

1. **Créer un compte** sur [Koyeb](https://www.koyeb.com)

2. **Connecter GitHub** :
   - Autoriser l'accès au repository
   - Sélectionner la branche `main`

3. **Configurer l'application** :
   - **Build command** : `npm install`
   - **Run command** : `node src/bot.js`
   - **Port** : `8000`
   - **Health check** : `/health`

4. **Ajouter les variables d'environnement** :
   ```
   DISCORD_TOKEN=xxx
   DISCORD_CLIENT_ID=xxx
   OWNER_ID=xxx
   NODE_ENV=production
   PORT=8000
   ```

5. **Déployer** : Push sur `main` déclenche auto-déploiement

### Health Check

Le bot expose un serveur Express sur le port 8000 :
- `GET /` : Informations générales
- `GET /health` : Status détaillé (uptime, guilds, users)

---

## 🔧 Développement

### Ajouter une commande

1. Créer un fichier dans `src/commands/<catégorie>/<nom>.js`

```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('macommande')
    .setDescription('Description de ma commande'),

  category: 'utility',
  cooldown: 3,
  userPermissions: [],
  botPermissions: [],

  async execute(interaction) {
    await interaction.reply('Hello World!');
  },
};
```

2. Redémarrer le bot (ou `/reload macommande`)

### Ajouter un événement

1. Créer un fichier dans `src/events/<catégorie>/<nom>.js`

```javascript
export default {
  name: 'messageCreate',
  category: 'message',
  once: false, // true = s'exécute une fois

  async execute(message) {
    console.log(`Message reçu: ${message.content}`);
  },
};
```

2. Redémarrer le bot

### Ajouter une migration

1. Créer `src/database/migrations/00X_nom_migration.js`

```javascript
export async function up(db) {
  db.exec(`
    CREATE TABLE ma_table (
      id INTEGER PRIMARY KEY,
      data TEXT
    )
  `);
  console.log('✅ Table créée');
}

export async function down(db) {
  db.exec(`DROP TABLE ma_table`);
  console.log('✅ Table supprimée');
}
```

2. Redémarrer le bot (migration auto)

---

## 📊 Performances

### Optimisations

- ✅ **SQLite synchrone** : Pas d'overhead async
- ✅ **Cache Discord.js** : Données en mémoire
- ✅ **Index BDD** : Recherches optimisées
- ✅ **Cooldowns en Map** : Pas de requêtes BDD
- ✅ **WAL mode** : Écritures concurrentes

### Métriques

- **Latence API** : ~50-150ms
- **Latence WebSocket** : ~20-80ms
- **Temps commande** : ~200-500ms
- **Mémoire** : ~100-200MB
- **CPU idle** : < 5%

---

## 🛡️ Sécurité

### Bonnes pratiques implémentées

✅ **Token sécurisé** : Variables d'environnement uniquement  
✅ **Gestion erreurs** : Try/catch partout  
✅ **Vérification permissions** : Bot + utilisateur  
✅ **Hiérarchie rôles** : Empêche abus modération  
✅ **Rate limiting** : Cooldowns sur commandes  
✅ **SQL injection** : Prepared statements  
✅ **Logs structurés** : Winston avec timestamps  

### Recommandations

⚠️ **Ne jamais commit** :
- Fichier `.env`
- Token Discord
- Fichiers de base de données

⚠️ **Backup régulier** :
- Base de données `sentinel.db`
- Configuration serveurs

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

1. **Fork** le projet
2. **Créer une branche** : `git checkout -b feature/ma-feature`
3. **Commit** : `git commit -m 'feat: ajout de ma feature'`
4. **Push** : `git push origin feature/ma-feature`
5. **Pull Request** : Ouvrir une PR sur GitHub

### Convention de commits

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage code
- `refactor:` Refactorisation
- `perf:` Performance
- `test:` Tests
- `chore:` Maintenance

---

## 📝 Changelog

### v2.0.0-alpha.1 (28/01/2026)

**🎉 Première version alpha en production**

- ✅ 22 commandes slash fonctionnelles
- ✅ Système de base de données SQLite
- ✅ Gestion événements Discord complète
- ✅ Déploiement Koyeb avec health check
- ✅ Documentation complète

**Fonctionnalités** :
- Modération (ban, kick, warn, clear)
- Économie (balance, daily, work, pay)
- Niveaux (XP automatique sur messages)
- Utilitaires (help, ping, avatar, infos)
- Administration (setup, config, reload)

---

## 📄 Licence

Ce projet est sous licence **MIT**.

```
MIT License

Copyright (c) 2026 swiffeurr59

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/votre-username/sentinel-bot/issues)
- **Discussions** : [GitHub Discussions](https://github.com/votre-username/sentinel-bot/discussions)
- **Discord** : [Serveur de support](https://discord.gg/votre-invite)

---

## 🙏 Remerciements

- [Discord.js](https://discord.js.org/) - Framework Discord
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Base de données
- [Winston](https://github.com/winstonjs/winston) - Système de logs
- [Koyeb](https://www.koyeb.com/) - Hébergement

---

<div align="center">

**Fait avec ❤️ par swiffeurr59**

⭐ **N'oubliez pas de mettre une étoile si le projet vous plaît !** ⭐

</div>
