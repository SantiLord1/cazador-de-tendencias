# Subir el repositorio a GitHub y publicarlo

## Opción A: desde la web de GitHub (sin instalar nada)

1. Entrá a <https://github.com/new>.
2. En **Repository name** poné `cazador-de-tendencias`, elegí **Public** y tocá **Create repository**.
3. En la página del repositorio vacío, tocá **uploading an existing file**.
4. Descomprimí el `.zip` y **arrastrá todo el contenido de la carpeta** (no la carpeta en sí): `index.html`, `README.md`, `data/`, `img/`, `docs/`, etc.
5. Abajo, en **Commit changes**, escribí "Primera versión" y confirmá.

## Opción B: con git desde la terminal

El `.zip` ya trae el historial de git. Dentro de la carpeta:

```bash
git remote add origin https://github.com/TU-USUARIO/cazador-de-tendencias.git
git branch -M main
git push -u origin main
```

## Publicar la página con GitHub Pages (gratis)

1. En el repositorio, entrá a **Settings → Pages**.
2. En **Source** elegí **Deploy from a branch**.
3. En **Branch** elegí `main` y la carpeta `/ (root)`, y tocá **Save**.
4. Esperá uno o dos minutos. La página queda en:
   `https://TU-USUARIO.github.io/cazador-de-tendencias/`

## Importante

- **No subas tu clave de API.** La página la guarda solo en tu navegador, nunca en los archivos.
- En GitHub Pages la página arranca en **modo ejemplo**. Para buscar en vivo, cada persona carga su propia clave en *Supuestos de importación*.
