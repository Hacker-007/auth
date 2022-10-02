import express from 'express'
import getHealth from './health'

export default function setupRoutes() {
  const router = express.Router()
  router.get('/health', getHealth)

  return router
}
