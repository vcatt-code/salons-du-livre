# 📚 Salons du livre

Suivi partagé des salons du livre entre plusieurs auteurs : liste commune des salons, suivi personnel (statut, notes), sources, et recherche assistée par IA (nouveaux salons, mise à jour des dates).

Site statique (HTML/CSS/JS, sans compilation) hébergé sur **GitHub Pages**. Données dans **Firebase** (Authentication + Cloud Firestore, offre gratuite « Spark »).

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html`, `styles.css`, `app.js` | Interface |
| `store-firebase.js` | Connexion Firebase (comptes + base temps réel) |
| `store-local.js` | Mode local de secours (si `config.js` n'est pas rempli) |
| `config.js` | **À compléter** avec la configuration Firebase |
| `img/` | Logo, illustration, icônes |

Les données initiales (`salons-initiaux.json`) et les règles de sécurité (`firestore.rules`) ne sont **pas** dans ce dépôt : elles contiennent des emails et des notes privées.

## Mise à jour du site

Modifier un fichier sur GitHub (✏️ puis *Commit changes*) : le site se met à jour en 1 à 2 minutes. Les données (Firestore) ne sont pas touchées.

## Ajouter un auteur

1. Console Firebase → *Firestore Database* → *Règles* : ajouter son email dans la liste, puis **Publier**.
2. Lui envoyer l'adresse du site. Il se connecte avec Google, ou crée un compte email + mot de passe (un email de vérification lui est envoyé).

## Structure des données (Firestore)

- `salons/{id}` : nom, ville, codePostal, pays, distCorbie, distOignies, dateDebut, dateFin, horaires, dateLimite, historiqueLimites[], historiqueEditions[], contacts{nom, emails[], telephones[], site, facebook, instagram, formulaire, autres}, notes, origine, creePar, majPar, majLe
- `users/{uid}` : name, email, salons{ <salonId>: {statut, notes, maj} }
- `sources/{id}` : titre, url, note, ajoutePar, ajouteLe

## Sauvegarde

Menu profil (avatar en haut à droite) → **Exporter tout (JSON)**. À faire de temps en temps.
