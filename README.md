# D-Pay — démonstration Mobile Money

D-Pay est une démonstration pédagogique d'un portefeuille mobile money pensé pour l'Afrique de l'Ouest.

> **Important :** cette application est un prototype de démonstration. Elle n'encaisse, ne conserve et ne transfère aucun fonds réel.

## Objectif

Montrer qu'une personne sans formation informatique peut décrire un produit en langage naturel et construire, avec l'aide de ChatGPT, une application fonctionnelle à partir d'un dépôt GitHub vide.

## Principes UX

- priorité au téléphone mobile ;
- une action principale par écran ;
- gros boutons et libellés explicites ;
- confirmation claire avant tout débit ;
- historique compréhensible ;
- pas de jargon bancaire inutile ;
- fonctionne sans compte développeur ni installation locale pour la démonstration.

## Fonctionnalités de la V1

- solde de démonstration ;
- envoi d'argent par numéro de téléphone ;
- paiement marchand ;
- réception via QR de démonstration ;
- recharge fictive du portefeuille ;
- historique des opérations ;
- confirmation par code PIN de démonstration ;
- persistance locale dans le navigateur ;
- interface responsive et installable comme PWA ;
- remise à zéro des données de démonstration.

## Tester

Ouvrir simplement `index.html` dans un navigateur, ou publier le dépôt avec GitHub Pages.

Code PIN de démonstration : `1234`.

## Architecture actuelle

La V1 est volontairement sans backend : les données sont stockées dans `localStorage` et ne représentent pas de monnaie réelle.

```text
index.html        Interface de l'application
styles.css        Design system mobile-first
app.js            Logique du portefeuille de démonstration
manifest.webmanifest  Installation PWA
sw.js             Cache hors-ligne minimal
.github/workflows/pages.yml  Déploiement GitHub Pages
```

## Passage vers un vrai produit

Avant toute utilisation avec des fonds réels, il faudra notamment remplacer le stockage local par un ledger transactionnel côté serveur, ajouter authentification forte, KYC, contrôles AML/CFT, gestion des limites, audit, observabilité, prévention de fraude, chiffrement, réconciliation, intégration à des partenaires/rails de paiement autorisés et cadrage réglementaire adapté aux pays ciblés.

## Inspiration

Le projet s'inspire de principes de simplicité observables dans les meilleures applications mobile money d'Afrique de l'Ouest, sans copier leur identité visuelle, leur marque, leur code ou leurs éléments propriétaires.
