import { Client, ClientSchema } from '@src/models/client'
import { APIError } from '@src/utils/errors'
import { validateAgainstSchema } from '@src/validation'

export interface IClientService {
  getClientById(id: unknown): Promise<Client>
}

export class InMemoryClientService implements IClientService {
  constructor(private readonly clients: Map<string, Client>) {}

  async getClientById(id: unknown): Promise<Client> {
    const { client_id: clientId } = await validateAgainstSchema(
      { client_id: id },
      ClientSchema.pick({ client_id: true })
    )

    const client = this.clients.get(clientId)
    if (!client) {
      throw new APIError(
        'invalid_client',
        `The client with the id \`${clientId}\` was not found.`
      )
    }

    return client
  }
}
