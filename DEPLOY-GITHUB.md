# Mettre le site sur GitHub Pages

## Ce que je ne peux pas faire à ta place

- Créer ton compte GitHub ou te connecter.
- Pousser le code sans **ton** identifiant / mot de passe ou **token**.

## Méthode la plus simple : **sans installer Git** (navigateur)

1. Va sur [github.com](https://github.com) et connecte-toi.
2. **New repository** → nom : par ex. `janton3d87` → **Public** → **Create repository**.
3. Sur la page du dépôt vide, clique **uploading an existing file**.
4. Glisse **tous les fichiers** de ce dossier sur la page :
   - `index.html`, `admin.html`, `payer.html`, `mentions-legales.html`, `confidentialite.html`
   - `script.js`, `styles.css`, `admin.js`, `admin.css`
   - le dossier **`assets`** (avec les images dedans)
5. **Commit changes** → message : `Site Janton 3D 87`.
6. **Settings** → **Pages** → **Source** : branche `main`, dossier **`/ (root)`** → **Save**.
7. Après 1–3 min, l’URL sera du type :  
   `https://TON_PSEUDO.github.io/janton3d87/`

*(Si ton dépôt s’appelle autrement, remplace `janton3d87` par le nom du repo.)*

---

## Avec Git sur ton PC (si tu installes [Git for Windows](https://git-scm.com/download/win))

Dans un terminal, dans ce dossier :

```powershell
git init
git add .
git commit -m "Site Janton 3D 87"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/janton3d87.git
git push -u origin main
```

Puis active **Pages** comme ci-dessus.

---

## Lien utile

- Documentation GitHub Pages : https://docs.github.com/pages
