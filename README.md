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
- For both text inputs, the input sizes are exactly 12 teams, 30 round robin matches. You can enter anything more or less

- There must be exactly 6 teams from each group. 

- Once you "lock in" the names, groups and registration dates of teams, you cannot edit teams any more, else the match results may not make sense. 

- In the match results, you can only edit the goals scored. You cannot edit teams since the round robin format dictates exactly 1 match against every other team in the group 

### (A lot of) Potential improvements

#### Core functionality 


#### Web Security 
- Capture user sessions (was going to try Firebase)
- Read/Write access limitations and admin access for mongo server 


#### Core business logic Design 
- Could have used a lot more OOP. Didn't really have time to plan a proper schema


#### DB choice
- Was going to go with SQLite for an embedded database (basically act as a glorified cache), but there doesn't seem to be many `JOIN` functions required. As a simple record store Mongo works

#### Hosting 
- If given more time, I would use Render to serve backend API, vercel for frontend and some free mongo AWS wrapper. 


#### Input sanitization 


#### State management 


#### Caching


#### Look and feel
- Given more time, I don't think the input should be text. I would have had drop-downs / other better styling 

- Would've used CSS libraries like Tailwind 