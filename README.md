# Janton 3D 87 — Site vitrine

Site statique (HTML, CSS, JavaScript) : conception et impression 3D en Haute-Vienne.

## Mise en ligne sur GitHub Pages (site toujours accessible)

Après avoir poussé ce dépôt sur GitHub :

1. Ouvre le dépôt sur **github.com**
2. **Settings** (Paramètres) → **Pages** (menu gauche)
3. **Build and deployment** → **Source** : **Deploy from a branch**
4. **Branch** : `main` — dossier **`/ (root)`** → **Save**
5. Attends 1 à 3 minutes : le site sera en ligne à l’adresse  
   **`https://VOTRE_PSEUDO.github.io/NOM_DU_DEPOT/`**

*(Remplace `VOTRE_PSEUDO` et `NOM_DU_DEPOT` par ton compte et le nom du repository.)*

### Fichier `.nojekyll`

Un fichier vide `.nojekyll` est présent à la racine : il indique à GitHub Pages de **ne pas** traiter le site avec Jekyll, ce qui évite des problèmes d’affichage sur un site HTML classique.

## Pages principales

| Fichier | Rôle |
|---------|------|
| `index.html` | Accueil |
| `payer.html` | Paiement CB (Stripe) |
| `admin.html` | Espace administration (mot de passe) |

## Mise à jour du site

Modifie les fichiers localement, puis :

```bash
git add .
git commit -m "Mise à jour"
git push
```

Les changements apparaissent sur GitHub Pages après quelques minutes.

## Aide pour envoyer le code sur GitHub

Voir `PUBLIER-SUR-GITHUB.md` ou utiliser `push-github.ps1` sur Windows.
