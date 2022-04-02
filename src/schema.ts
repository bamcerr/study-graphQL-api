import { makeExecutableSchema } from "@graphql-tools/schema"
import type { GraphQLContext } from "./context"
import type { Link } from '@prisma/client'
import { GraphQLYogaError } from "@graphql-yoga/node"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime"
import { getMovies, getMovie, getSuggestions } from "./db"

const typeDefinitions = /* GraphQL */`
  type Query {
    info: String!
    feed(filterNeedle: String, skip: Int, take: Int): [Link!]!
    comment(id: ID!): Comment
    movies(limit: Int, rating: Float): [Movie]!
    movie(id: ID!): MovieDetail!
    movie_suggestions(id: ID!): [Movie]!
  }

  type Movie {
    id: Int!
    title: String!
    rating: Float!
    summary: String!
    language: String!
    medium_cover_image: String!
  }
  type MovieDetail {
    id: Int!
    title: String!
    rating: Float!
    description_full: String!
    language: String!
    medium_cover_image: String!
  }

  type Link {
    id: ID!
    description: String!
    url: String!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    body: String!
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
  }
`

const parseIntSafe = (value: string): number | null => {
  if (/^(\d+)$/.test(value)) {
    return parseInt(value, 10)
  }
  return null
}

const applyTakeConstraints = (params: {
  min: number
  max: number
  value: number
}) => {
  if (params.value < params.min || params.value > params.max) {
    throw new GraphQLYogaError(
      `'take' arguement value '${params.value}' is outside the valid rage of '${params.min}' to '${params.max}'`
    )
  }
  return params.value
}

const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (
      parent: unknown, 
      args: { filterNeedle?: string, skip?: number, take?: number }, 
      context: GraphQLContext
    ) => {
      const where = args.filterNeedle ? {
        OR: [
          { description: { contains: args.filterNeedle } },
          { url: { contains: args.filterNeedle } }
        ]
      } : {}

      const take = applyTakeConstraints({
        min: 1,
        max: 50,
        value: args.take ?? 30,
      })
      return context.prisma.link.findMany({ 
        where,
        skip: args.skip,
        take: take
      })
    },
    comment: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      return context.prisma.comment.findUnique({
        where: { id: parseInt(args.id )}
      })
    },
    movies: (_:unknown, args:{ rating:number, limit:number }) => getMovies(args.limit, args.rating),
    movie: (_:unknown, args:{ id:number }) => getMovie(args.id),
    movie_suggestions: (_:unknown, args:{ id:number }) => getSuggestions(args.id),
  },

  Link: {
    id: (parent: Link) => { console.log(parent); return parent.id},
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    comments: (parent: Link, args: {}, context: GraphQLContext) => {
      return context.prisma.comment.findMany({
        where: {
          linkId: parent.id
        }
      })
    }
  },

  Mutation: {
    postLink: async (parent: unknown, args: { description: string; url: string }, context: GraphQLContext) => {
      const newLink = await context.prisma.link.create({
        data: {
          url: args.url,
          description: args.description
        }
      })

      return newLink
    },
    postCommentOnLink: async (parent: unknown, args: { linkId: string; body: string }, context: GraphQLContext) => {
      const linkId = parseIntSafe(args.linkId)
      if (linkId === null) {
        return Promise.reject(
          new GraphQLYogaError(
            `Cannot post common on non-existing link with id ${args.linkId}.`
          )
        )
      }
      const comment = await context.prisma.comment.create({
        data: {
          linkId,
          body: args.body
        }
      }).catch((err: unknown) => {
        if ( err instanceof PrismaClientKnownRequestError && err.code === 'P2003') {
          return Promise.reject(
            new GraphQLYogaError(
              `Cannot post common on non-existing link with id ${args.linkId}.`
            )
          )
        }
        return Promise.reject(err)
      })

      return comment
    }
  },  
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions]
})