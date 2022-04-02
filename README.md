https://www.graphql-yoga.com/tutorial/basic/01-project-setup

`
$ yarn add --dev typescript @types/node ts-node ts-node-dev cross-env;    
$ yarn tsc --init
`

`
$ yarn add @graphql-yoga/node graphql
$ curl -X POST http://localhost:4000/graphql -H "Content-type: application/json" --data-raw '{"query": "query { hello }"}'
`

`
$ yarn add --dev prisma @prisma/client
$ yarn prisma init
...
$ yarn prisma migrate dev
$ yarn prisma generate
...
$ yarn ts-node src/script.ts
...
$ yarn ts-node src/script.ts
$ yarn prisma studio
`


