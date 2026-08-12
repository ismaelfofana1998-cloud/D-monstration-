# D-Pay — démonstration Mobile Money

D-Pay est une démonstration pédagogique d'un portefeuille mobile money pensé pour l'Afrique de l'Ouest.

> **Important :** cette application est un prototype de démonstration. Elle n'encaisse, ne conserve et ne transfère aucun fonds réel.

## Objectif

Montrer qu'une personne sans formation informatique peut décrire un produit en langage naturel et construire, avec l'aide de ChatGPT, une application fonctionnelle à partir d'un dépôt GitHub vide.

## Facteur clé de succès : simplicité radicale

La simplicité n'est pas une finition graphique : c'est une contrainte produit.

D-Pay doit pouvoir être utilisé par une personne ayant très peu d'expérience numérique ou des difficultés de lecture. Une fonctionnalité peut être techniquement complexe en arrière-plan sans rendre le parcours utilisateur complexe.

Règles persistantes :

- quatre actions principales maximum sur l'accueil : **Envoyer, Payer, Ajouter, Recevoir** ;
- une seule décision importante par écran ;
- gros boutons et pictogrammes stables ;
- montants affichés en très grands chiffres ;
- montants rapides pour réduire la saisie ;
- aucun vocabulaire bancaire inutile ;
- confirmation très visuelle avant un débit ;
- code secret sur grand clavier numérique ;
- aide vocale activable, activée par défaut dans la démo ;
- retour visuel, vocal et vibration lorsque le terminal les permet ;
- les réglages et fonctions avancées ne doivent jamais encombrer le parcours principal.

Le produit s'inspire de la simplicité d'usage qui a fait le succès des meilleures applications mobile money régionales, notamment Wave, sans copier sa marque, son identité visuelle, son code ni ses éléments propriétaires.

## Fonctionnalités de la V1

- solde de démonstration ;
- envoi d'argent par numéro de téléphone ;
- frais de transfert de démonstration à 1 % ;
- paiement marchand fictif ;
- réception via QR visuel de démonstration ;
- ajout fictif d'argent ;
- historique des opérations ;
- confirmation par PIN sur pavé numérique ;
- aide vocale via les fonctions du navigateur compatibles ;
- vibration/haptique sur les appareils compatibles ;
- persistance locale dans le navigateur ;
- interface responsive et installable comme PWA ;
- cache hors-ligne minimal ;
- remise à zéro des données de démonstration.

## Tester

Code PIN de démonstration : `1234`.

Le site est statique. Une fois GitHub Pages activé pour le dépôt avec **GitHub Actions** comme source, le workflow `.github/workflows/pages.yml` publie automatiquement l'application.

Le workflow vérifie d'abord la syntaxe de `app.js` et la présence des fichiers nécessaires avant de tenter le déploiement.

## Architecture actuelle

La V1 est volontairement sans backend : les données sont stockées dans `localStorage` et ne représentent pas de monnaie réelle.

```text
index.html                    Structure de l'application
styles.css                    Design system mobile-first
assist.css                    Couche UX simplifiée et assistée
app.js                        Logique du portefeuille de démonstration
manifest.webmanifest          Installation PWA
sw.js                         Cache hors-ligne minimal
.github/workflows/pages.yml   Validation et déploiement GitHub Pages
```

## Passage vers un vrai produit

Avant toute utilisation avec des fonds réels, il faudra notamment remplacer le stockage local par un ledger transactionnel côté serveur, ajouter authentification forte, KYC, contrôles AML/CFT, gestion des limites, audit, observabilité, prévention de fraude, chiffrement, réconciliation, intégration à des partenaires/rails de paiement autorisés et cadrage réglementaire adapté aux pays ciblés.

Ces exigences de sécurité et de conformité devront rester autant que possible invisibles dans le parcours quotidien de l'utilisateur.
