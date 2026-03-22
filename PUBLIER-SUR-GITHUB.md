# Publier ce projet sur ton GitHub (2 minutes)

Le **premier commit est déjà fait** sur ton PC (branche `main`).

## Étape 1 — Créer le dépôt vide sur GitHub

1. Va sur [github.com/new](https://github.com/new)
2. **Repository name** : par ex. `janton3d87`
3. **Public**
4. **Ne coche pas** « Add a README »
5. Clique **Create repository**

## Étape 2 — Lier et envoyer (remplace PSEUDO et NOM_REPO)

Ouvre **PowerShell** ou **Invite de commandes** dans ce dossier, puis exécute :

```powershell
cd "c:\Users\fgour\Desktop\site janton3D87"

& "C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/PSEUDO/NOM_REPO.git

& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

*(Si `remote add` dit que `origin` existe déjà : remplace la ligne par  
`git remote set-url origin https://github.com/PSEUDO/NOM_REPO.git`)*

## Connexion

Au premier `push`, GitHub demande un identifiant :

- **Username** : ton pseudo GitHub  
- **Password** : un **Personal Access Token** (pas ton mot de passe du site)  
  → Crée-en un ici : [github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token** → coche **repo**, puis copie le token et colle-le comme mot de passe.

## Après le push

- Active **GitHub Pages** : repo → **Settings** → **Pages** → Source : branche **main**, dossier **/ (root)**.
- Ton site : `https://PSEUDO.github.io/NOM_REPO/`

---

## Mettre Git dans le PATH (optionnel)

Pour taper seulement `git` au lieu du chemin complet : réinstalle [Git for Windows](https://git-scm.com/download/win) et coche **« Add Git to PATH »**.
