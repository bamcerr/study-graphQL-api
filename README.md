`
$ yarn add @graphql-yoga/node graphql
$ yarn global add nodemon
$ yarn add --dev typescript @types/node ts-node ts-node-dev cross-env;    
$ yarn tsc --init
`

https://www.graphql-yoga.com/tutorial/basic/01-project-setup

`
curl -X POST http://localhost:4000/graphql -H "Content-type: application/json" --data-raw '{"query": "query { hello }"}'
`
