require('dotenv').config()
const { PrismaClient } = require('./generated/prisma')
const { PrismaNeon } = require('@prisma/adapter-neon')

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

module.exports = { prisma }
