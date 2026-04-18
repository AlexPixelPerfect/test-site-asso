# Pour (F) La Vie — Site officiel

Site vitrine statique de l'association « Pour (F) La Vie », engagée contre la leucémie.

## Stack

HTML / CSS / JavaScript natif. Aucun framework, aucune étape de build, aucune dépendance.
Polices Google Fonts (Fraunces + Inter) chargées via CDN — à self-héberger en production pour le RGPD.

## Structure

```
/
├── index.html              Accueil
├── association.html        Qui sommes-nous
├── leucemie.html           Comprendre la leucémie
├── don-moelle.html         Devenir donneur de moelle
├── faire-un-don.html       Soutenir financièrement
├── evenements.html         Color Run & événements
├── contact.html            Contact + bénévolat + partenariats
├── mentions-legales.html   Mentions légales & RGPD
├── 404.html
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── site.webmanifest
├── assets/
│   ├── css/  (tokens, reset, base, components, pages)
│   └── js/   (main.js, a11y.js)
└── logo/Logo pour flavie.png
```

## Développement local

Le site étant 100 % statique, il suffit d'ouvrir `index.html` dans un navigateur.
Pour éviter les erreurs CORS sur certaines fonctionnalités, préférez un serveur local :

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

Puis ouvrez http://localhost:8000.

## Déploiement

### Option 1 — Netlify (gratuit, le plus simple)

1. Rendez-vous sur https://app.netlify.com/drop
2. Glissez-déposez le dossier complet du site
3. Votre site est en ligne en quelques secondes avec une URL provisoire

Pour connecter votre propre nom de domaine : **Site settings > Domain management**.

### Option 2 — OVH / hébergement FTP classique

Envoyez tous les fichiers et dossiers à la racine du dossier `www/` de votre hébergement via FileZilla, Cyberduck ou l'outil FTP OVH. Rien d'autre à faire.

### Option 3 — GitHub Pages

1. Poussez le dossier dans un dépôt GitHub
2. Settings > Pages > Source = `main` / root
3. Le site est publié sur `https://<user>.github.io/<repo>/`

## À personnaliser avant la mise en ligne

- **Liens de don** : remplacer `https://www.helloasso.com/` par votre URL HelloAsso réelle dans `index.html`, `faire-un-don.html`, `evenements.html`.
- **Coordonnées** : email, téléphone, adresse du siège dans le footer de chaque page.
- **Numéro RNA** : dans `association.html` et `mentions-legales.html`.
- **Hébergeur** : compléter la section hébergement dans `mentions-legales.html`.
- **Événements** : date, lieu, URL de billetterie dans `evenements.html`.
- **Photos** : remplacer les gradients décoratifs par de vraies photos dans `assets/img/` et mettre à jour les références dans les HTML.
- **Images Open Graph** : créer les PNG 1200×630 dans `assets/og/` (`home.jpg`, `association.jpg`, etc.).
- **Réseaux sociaux** : remplacer les `href="#"` dans le footer par les vraies URL.

## Accessibilité & performance

- Balisage HTML5 sémantique
- Contrastes WCAG AA vérifiés
- Navigation clavier complète + focus visibles
- `prefers-reduced-motion` respecté
- Pas de cookies tiers, pas de tracking
- Aucune dépendance JS tierce

Testez avec Lighthouse (DevTools > Lighthouse) et axe DevTools.

## Licence

Contenus propriété de l'association Pour (F) La Vie. Code source : usage interne.
