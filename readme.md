// project setup commands
npm i
npx prisma migrate deploy
npx prisma generate
npm start

//generate migration files
npx prisma migrate dev --name alter_client_table
