# Ghid de Deployment (Vercel)

Acest document descrie procedura corectă și secvențială pentru publicarea aplicației "Frigider" pe Vercel, folosind două proiecte Vercel separate pentru a despărți logic Backend-ul (API Docker) de Frontend (Vite SPA).

---

## Arhitectura de Deployment

* **Backend (API)**: Deployat ca Vercel Docker Container din rădăcina repository-ului (root), folosind `vercel.json` din root și `backend/Dockerfile.vercel`.
* **Frontend (UI)**: Deployat ca Static Site (SPA), din directorul `/frontend`, folosind `frontend/vercel.json` pentru regulile de rewrite specice React Router.

---

## Ordinea Pașilor (Foarte Important)

Deoarece Backend-ul are nevoie de URL-ul Frontend-ului (pentru regula CORS `FRONTEND_ORIGIN`), iar Frontend-ul are nevoie de URL-ul Backend-ului (pentru apelurile API via `VITE_API_URL`), procesul trebuie realizat **strict în această ordine**:

### Pasul 1: Deploy Backend (API)

1. În dashboard-ul Vercel, creează un **New Project**.
2. Importă repository-ul GitHub.
3. Configurează proiectul:
   * **Framework Preset**: *Other*
   * **Root Directory**: `./` (lasă gol / rădăcina repo-ului).
4. Adaugă următoarele **Environment Variables** (în tab-ul *Environment Variables*):
   * `PORT` = `8080`
   * `ASPNETCORE_ENVIRONMENT` = `Production`
   * `FRONTEND_ORIGIN` = `https://dummy-url.vercel.app` *(o valoare temporară, o vom înlocui la Pasul 3)*
5. Apasă **Deploy**.
6. După finalizare, copiază domeniul generat de Vercel pentru backend (ex: `https://frigider-api.vercel.app`). Acesta va fi `API_URL`.

### Pasul 2: Deploy Frontend

1. În dashboard-ul Vercel, creează un **al doilea proiect** (New Project).
2. Importă *același* repository GitHub.
3. Configurează proiectul:
   * **Framework Preset**: *Vite*
   * **Root Directory**: `frontend` (apasă Edit și selectează folderul `frontend`).
4. Verifică comenzile de build (ar trebui să fie autodetectate):
   * **Build Command**: `npm run build` sau `tsc -b && vite build`
   * **Output Directory**: `dist`
5. Adaugă următoarea **Environment Variable**:
   * `VITE_API_URL` = `<URL-ul copiat la Pasul 1>` *(ex: `https://frigider-api.vercel.app` - fără slash la final)*
6. Apasă **Deploy**.
7. După finalizare, copiază domeniul generat de Vercel pentru frontend (ex: `https://frigider.vercel.app`).

### Pasul 3: Actualizarea politicii CORS pe Backend

1. Întoarce-te la **proiectul Vercel pentru Backend**.
2. Mergi la secțiunea **Settings > Environment Variables**.
3. Editează variabila `FRONTEND_ORIGIN` și setează-i valoarea cu domeniul real al frontend-ului obținut la Pasul 2 (ex: `https://frigider.vercel.app`).
4. Mergi la tab-ul **Deployments**, selectează cel mai recent deploy și alege **Redeploy**. Acest pas este esențial pentru ca instanța Docker de producție să citească noua valoare din variabilele de mediu și să accepte cererile de la frontend.

---

## Verificarea Sistemului în Producție

După ce ambele proiecte sunt publicate și CORS-ul este aliniat, execută următorul checklist direct pe mediul de producție:

1. [ ] **Verifică API Health:** 
   Accesează `https://<URL-Backend>/health` din browser sau Postman. Ar trebui să întoarcă un răspuns JSON cu `{ "status": "ok" }`.
2. [ ] **Verifică rutele React Router (SPA Fallback):**
   Navighează pe frontend la pagina principală. Apoi adaugă `/recipes` direct în bara de adrese a browser-ului și apasă Enter (Refresh). Datorită lui `frontend/vercel.json`, Vercel ar trebui să randeze corect pagina React, fără eroarea `404 Not Found`.
3. [ ] **Verifică fluxul End-to-End Frontend → API (CORS & Matching):**
   * Adaugă 2-3 ingrediente în UI.
   * Apasă butonul de găsire rețete / mergi pe pagina de potriviri.
   * Deschide Consola (DevTools) și Network tab; asigură-te că request-ul către `/api/recipes/match` se termină cu Status 200 și nu e blocat de "CORS Policy".
   * Intră în detaliile unei rețete și verifică randarea URL-urilor externe pentru imagini.
4. [ ] **Verifică funcționalitățile In-Memory (Zustand):**
   * Adaugă ingrediente lipsă pe lista de cumpărături.
   * Marchează o rețetă ca Favorită.
   * Dă un refresh complet la pagină (F5). Datele (ingrediente, favorite) ar trebui să dispară, confirmând respectarea Deciziei de Produs #2 (fără persistență).
