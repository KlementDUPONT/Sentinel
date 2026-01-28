# 🤖 Sentinel – Discord Bot

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0--alpha.1-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14-7289DA)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-stable-success)

**Bot Discord complet : modération, économie, niveaux, outils et fun.**

[Installation](#-installation) • [Configuration](#️-configuration) • [Commandes](#-commandes) • [Développement](#-développement)

</div>

---

## ✨ Fonctionnalités

### 🛡️ Modération
- Avertissements persistants (warns) avec historique.
- Sanctions : bannissement, expulsion, nettoyage de messages.
- Journal de modération centralisé (logs dédiés).

### 💰 Économie
- Portefeuille + compte en banque par utilisateur et par serveur.
- Récompenses quotidiennes (`/daily`) et travail rémunéré (`/work`).
- Transferts entre utilisateurs (`/pay`) et classement des plus riches.

### 📈 Niveaux & XP
- Gain d'XP basé sur l'activité (messages).
- Niveaux progressifs avec formule équilibrée.
- Annonce des montées de niveau et leaderboard possible.

### 🎲 Fun
- Boule magique (`/8ball`).
- Pile ou face (`/coinflip`).
- Lancer de dés paramétrable (`/dice`).

### 🔧 Utilitaires
- Informations serveur et utilisateur.
- Affichage d'avatar.
- Commande d'aide interactive.
- Test de latence (`/ping`).

### ⚙️ Administration
- Configuration automatique du serveur via `/setup`.
- Ajustement fin des paramètres via `/config`.
- Rechargement de commandes sans redémarrage avec `/reload`.

---

## 📦 Prérequis

- Node.js **>= 18.0.0**
- npm **>= 8.0.0**
- Un compte Discord avec accès au **Developer Portal**
- Un bot Discord créé (Client ID + token)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/sentinel.git
cd sentinel
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Discord
DISCORD_TOKEN=ton_token_discord
DISCORD_CLIENT_ID=ton_client_id
OWNER_ID=ton_id_utilisateur

# Environnement
NODE_ENV=development

# Port du serveur de statut (optionnel)
PORT=8000
```

⚠️ Ne jamais committer `.env` (ajouté dans `.gitignore`).

### 4. Lancer le bot

```bash
# Développement
npm run dev

# Production
npm start
```

---

## ⚙️ Configuration

### Configuration automatique – `/setup`

Commande à lancer par un administrateur dès l'arrivée du bot sur un serveur :

- Création du rôle `Muted` et configuration de ses permissions.
- Création d'un salon de logs dédié.
- Création d'un salon de bienvenue.
- Enregistrement de la configuration dans la base de données.

### Configuration manuelle – `/config`

Permet d'ajuster les paramètres du serveur :

- Salon de bienvenue
- Salon de logs
- Rôle muted
- Rôle automatique à l'arrivée
- Activation / désactivation de certains modules (économie, niveaux, etc. si prévu)

---

## 📖 Commandes

### 🛡️ Modération

| Commande                    | Description                        | Permission requise       |
|----------------------------|------------------------------------|--------------------------|
| `/ban <user> [reason]`     | Bannir un membre                  | BAN_MEMBERS             |
| `/kick <user> [reason]`    | Expulser un membre                | KICK_MEMBERS            |
| `/warn <user> <reason>`    | Ajouter un avertissement          | MODERATE_MEMBERS        |
| `/warnings <user>`         | Lister les avertissements         | MODERATE_MEMBERS        |
| `/clear <amount> [user]`   | Supprimer plusieurs messages      | MANAGE_MESSAGES         |

### 💰 Économie

| Commande                        | Description                        | Cooldown |
|--------------------------------|------------------------------------|----------|
| `/balance [user]`              | Affiche la balance d'un utilisateur | –      |
| `/daily`                       | Récompense journalière             | 24 h    |
| `/work`                        | Gagner de l'argent en travaillant  | 1 h     |
| `/pay <user> <amount>`         | Transférer des coins               | –       |
| `/leaderboard [balance/level]` | Classement économie/niveaux        | –       |

### 📈 Niveaux

| Commande         | Description                     |
|-----------------|---------------------------------|
| `/rank [user]`  | Niveau et XP d'un utilisateur   |

### 🎲 Fun

| Commande                 | Description                        |
|-------------------------|------------------------------------|
| `/8ball <question>`     | Réponse aléatoire type "8ball"    |
| `/coinflip`             | Pile ou face                      |
| `/dice [sides]`         | Lancer un dé (6, 12, 20, 100…)    |

### 🔧 Utilitaires

| Commande              | Description                          |
|----------------------|--------------------------------------|
| `/help [command]`    | Aide générale ou détaillée par commande |
| `/ping`              | Latence API / WebSocket             |
| `/avatar [user]`     | Avatar d'un utilisateur             |
| `/userinfo [user]`   | Infos détaillées sur un utilisateur |
| `/serverinfo`        | Infos complètes sur le serveur      |

### ⚙️ Administration

| Commande                         | Description                         | Permission       |
|---------------------------------|-------------------------------------|------------------|
| `/setup`                        | Configuration automatique           | ADMINISTRATOR    |
| `/config <option> <value>`      | Modifier la configuration           | ADMINISTRATOR    |
| `/reload <command>`             | Recharger une commande              | Propriétaire bot |

---

## 🗂️ Structure du projet

```
sentinel/
├── src/
│   ├── bot.js                 # Point d'entrée
│   ├── commands/              # Commandes slash
│   │   ├── admin/
│   │   ├── economy/
│   │   ├── fun/
│   │   ├── levels/
│   │   ├── moderation/
│   │   └── utility/
│   ├── config/
│   │   └── config.js          # Configuration globale
│   ├── database/
│   │   └── migrations/        # Migrations SQLite
│   ├── events/
│   │   ├── client/            # ready, interactionCreate…
│   │   ├── guild/             # guildCreate, guildDelete…
│   │   └── member/            # guildMemberAdd, guildMemberRemove…
│   ├── handlers/
│   │   ├── CommandHandler.js  # Chargement des commandes
│   │   ├── DatabaseHandler.js # Accès base de données
│   │   └── EventHandler.js    # Gestion des events
│   └── utils/
│       └── logger.js          # Logger centralisé
├── data/
│   └── sentinel.db            # Base SQLite (générée au runtime)
├── package.json
├── .env
├── .gitignore
└── README.md
```

---

## 💾 Base de données

Sentinel utilise **SQLite** via un gestionnaire centralisé.

### Tables principales

- **guilds** : Configuration par serveur (channels, rôles, modules actifs)
- **users** : Économie, niveaux, XP, timestamps de cooldown
- **warns** : Avertissements (user, modérateur, raison, actif/inactif)
- **tickets** : Tickets de support (si activé)
- **mod_logs** : Historique des actions de modération

Les migrations sont appliquées automatiquement au démarrage, ce qui garantit que le schéma est à jour sans intervention manuelle.

### Schéma détaillé

#### Table `guilds`
```sql
CREATE TABLE guilds (
  guild_id TEXT PRIMARY KEY,
  name TEXT,
  prefix TEXT DEFAULT '+',
  welcome_channel TEXT,
  log_channel TEXT,
  mute_role TEXT,
  auto_role TEXT,
  level_system_enabled BOOLEAN DEFAULT 1,
  economy_enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `users`
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  balance INTEGER DEFAULT 0,
  bank INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  last_daily DATETIME,
  last_work DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, guild_id),
  FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
);
```

---

## 🔧 Développement

### Ajouter une commande

Créer un fichier dans `src/commands/<catégorie>/<nom>.js` :

```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Commande d'exemple'),

  category: 'utility',
  cooldown: 3,
  userPermissions: [],
  botPermissions: [],

  async execute(interaction) {
    await interaction.reply('Exemple de réponse.');
  },
};
```

La commande est chargée automatiquement au démarrage.

### Ajouter un événement

Créer un fichier dans `src/events/<catégorie>/<nom>.js` :

```javascript
export default {
  name: 'messageCreate',
  category: 'message',
  once: false,

  async execute(message) {
    if (message.author.bot) return;
    // Logique personnalisée ici
  },
};
```

### Ajouter une migration

Créer un fichier dans `src/database/migrations/00X_nom_migration.js` :

```javascript
export async function up(db) {
  db.exec(`
    CREATE TABLE nouvelle_table (
      id INTEGER PRIMARY KEY,
      data TEXT
    )
  `);
  console.log('✅ Table créée');
}

export async function down(db) {
  db.exec(`DROP TABLE nouvelle_table`);
  console.log('✅ Table supprimée');
}
```

Les migrations sont exécutées automatiquement au démarrage.

---

## 📊 Performances

### Optimisations implémentées

- ✅ **SQLite synchrone** : Pas d'overhead async, requêtes rapides
- ✅ **Cache Discord.js** : Données en mémoire (guilds, users, channels)
- ✅ **Index de base de données** : Recherches optimisées
- ✅ **Cooldowns en mémoire** : Map JavaScript, pas de requêtes BDD
- ✅ **WAL mode** : Écritures concurrentes sans blocage

### Métriques typiques

- **Latence API Discord** : 50-150 ms
- **Latence WebSocket** : 20-80 ms
- **Temps d'exécution commande** : < 500 ms
- **Mémoire utilisée** : 100-200 MB
- **CPU au repos** : < 5%

---

## 🛡️ Sécurité & bonnes pratiques

### Mesures de sécurité

✅ **Variables d'environnement** : Token et informations sensibles dans `.env`  
✅ **Gestion des erreurs** : Try/catch systématique  
✅ **Vérification des permissions** : Bot ET utilisateur  
✅ **Hiérarchie des rôles** : Empêche les abus de modération  
✅ **Rate limiting** : Cooldowns sur toutes les commandes  
✅ **Requêtes préparées** : Protection contre les injections SQL  
✅ **Logs structurés** : Winston avec timestamps et niveaux  

### Recommandations

⚠️ **À ne jamais committer** :
- Fichier `.env`
- Tokens Discord
- Base de données `sentinel.db`

⚠️ **Sauvegardes régulières** :
- Base de données SQLite
- Configuration des serveurs

---

## 🤝 Contribution

Les contributions sont les bienvenues !

### Processus

1. **Fork** le projet
2. **Créer une branche** : `git checkout -b feature/nouvelle-fonctionnalite`
3. **Commit** : `git commit -m 'feat: ajout nouvelle fonctionnalité'`
4. **Push** : `git push origin feature/nouvelle-fonctionnalite`
5. **Pull Request** : Ouvrir une PR avec description détaillée

### Convention de commits

Suivre la convention **Conventional Commits** :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, style de code
- `refactor:` Refactorisation sans changement de fonctionnalité
- `perf:` Amélioration des performances
- `test:` Ajout ou modification de tests
- `chore:` Tâches de maintenance

---

## 📝 Changelog

### v2.0.0-alpha.1 (28 janvier 2026)

**🎉 Première version alpha stable**

**Fonctionnalités principales** :
- ✅ 22 commandes slash fonctionnelles
- ✅ Système de base de données SQLite avec migrations automatiques
- ✅ Gestion complète des événements Discord
- ✅ Health check server pour monitoring
- ✅ Documentation complète

**Modules** :
- **Modération** : ban, kick, warn, warnings, clear
- **Économie** : balance, daily, work, pay, leaderboard
- **Niveaux** : rank, XP automatique sur messages
- **Fun** : 8ball, coinflip, dice
- **Utilitaires** : help, ping, avatar, userinfo, serverinfo
- **Administration** : setup, config, reload

**Technique** :
- Architecture modulaire avec handlers
- Gestion d'erreurs centralisée
- Logging avec Winston
- Cooldowns et rate limiting
- Sécurité renforcée (permissions, hiérarchie rôles)

---

## 📄 Licence

Ce projet est sous licence **MIT**.

```
MIT License

Copyright (c) 2026 Clément DUPONT

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

## 👤 Auteur

**Clément DUPONT**

---

## 🙏 Remerciements

- [Discord.js](https://discord.js.org/) – Framework Discord pour Node.js
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) – Driver SQLite performant
- [Winston](https://github.com/winstonjs/winston) – Système de logging
- La communauté Discord.js pour le support et les ressources

---

<div align="center">

**Fait avec ❤️ par Clément DUPONT**

⭐ **Si ce projet vous plaît, n'hésitez pas à lui donner une étoile !** ⭐

</div>
