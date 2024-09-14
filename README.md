#### Pre-Requisites:
- docker compose 

### Build and run 
- `docker-compose up -d` or `docker compose up -d` depending on your docker installation 


### If docker doesn't work, have to build frontend/backend/db manually 
- Refer to `README.md` of both frontend/backend, essentially:
    - Frontend (need node + React)
        - `cd frontend2`
        - build as you would any react frontend
        - `npm install`
        - `npm run build`
        - `npm run start`
    
    - Backend (at least python 3.9):
        - `cd backend`
        - `pip install -r requirements.txt`
        - `uvicorn app.main:app --host "0.0.0.0" --port 8000 --reload`
        - `http://127.0.0.1:8000/docs#/` -> to checkout the schema
    
    - Database
        - Ensure you have mongoDB served at `localhost:27017`
        - No login credentials
    
### Assumptions
- Edit 

- 

### (A lot of) Potential improvements

#### Core functionality 


#### Web Security 
- Capture user sessions (was going to try Firebase)
- Read/Write access limitations and admin access for mongo server 


#### Design 
- Could have used a lot more OOP. Didn't really have time to plan a proper schema

- Was going to go with SQLite for an embedded database (basically act as a glorified cache), but there doesn't seem to be many `JOIN` functions required. As a simple record store Mongo works

#### Hosting 
- I was going to use Render to serve backend API, vercel frontend and some free mongo AWS service. Done it before but ran out of time 

- Managed to get vercel to work but the API 


#### Input sanitization 

#### Look and feeeeeel
- Given more time, I don't think the input should be text. I would have had drop-downs / other better styling 

- Would've used CSS libraries like Tailwind 